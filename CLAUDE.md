# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

HANNAsNote is a local-first personal "ID note" app: quick-capture ideas/sentences/photos, organize by category, connect notes via Obsidian-style `[[wikilinks]]`, and browse them via a freeform canvas board and a network graph view. Phase 1 (current) is single-user, runs entirely on the owner's Mac, and stores all data locally (SQLite file + local image files) — no accounts, no cloud, no external server. Multi-user/cloud/gamified phases are explicitly deferred; don't build toward them preemptively.

The full product plan (screens, theme spec, milestones) lives at `~/.claude/plans/my-id-note-drifting-teapot.md` on the machine this was built on — not part of this repo, so don't assume it's reachable. The essentials are summarized below.

## Environment setup (important)

Node.js is **not** a system install here — it's managed via nvm in `~/.nvm`, and no shell profile sourced it by default when this project was bootstrapped. Any fresh non-interactive shell needs nvm sourced before `node`/`npm` will resolve:

```bash
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

`~/.zshrc` now sources nvm automatically for interactive shells, so a normal Terminal session is fine — this only matters for scripted/non-interactive invocations (e.g. `.claude/launch.json` uses `scripts/dev.sh`, which sources nvm itself).

This npm install has script execution locked down (`allowScripts` in `package.json`). Any new dependency with a native build/postinstall step (like `better-sqlite3`, `sharp`, `prisma`) will silently skip its install script until approved:

```bash
npm approve-scripts <pkg-name>
npm install   # re-run to actually execute the approved script
```

## Common commands

```bash
npm run dev      # start Next.js dev server (localhost:3000)
npm run build    # production build
npm run lint     # eslint

npx prisma migrate dev --name <name>   # create + apply a migration
npx prisma generate                     # regenerate the client after schema.prisma changes
npx prisma migrate status               # check pending/applied migrations
```

`npx prisma migrate dev` prints a shadow-database drift error at the end in this non-interactive environment ("environment is non-interactive, which is not supported") even when the migration applied successfully — always confirm with `npx prisma migrate status` rather than trusting the exit output.

For daily non-technical use, `start.command` (project root) is what the owner double-clicks — it sources nvm, runs `npm install` on first run only, picks port 3000/3001, starts `next dev`, and opens the browser. `scripts/dev.sh` is a separate, simpler script used only by `.claude/launch.json` for preview-tool development.

## Architecture

**Stack**: Next.js App Router + TypeScript, Prisma 7 + SQLite (via `better-sqlite3` driver adapter), Tailwind CSS. One process, no separate backend.

**Prisma 7 specifics (this bit differs from most Prisma docs/training data)**: the generator uses `provider = "prisma-client"` (not the classic `prisma-client-js`) and outputs to `src/generated/prisma/` — import from `@/generated/prisma/client`, not `@prisma/client`. The generated client requires an explicit **driver adapter**; passing `datasourceUrl` to `new PrismaClient()` throws (`Unknown property datasourceUrl`). See `src/lib/prisma.ts` — it builds a `PrismaBetterSqlite3` adapter from `DATABASE_URL`, stripping the `file:` prefix since the adapter wants a plain filesystem path. `DATABASE_URL` in `.env` (`file:./data/notes.db`) is resolved relative to the project root (`prisma.config.ts`'s cwd), **not** relative to `prisma/schema.prisma` — don't use `../data/...`.

**Data model** (`prisma/schema.prisma`): `Note` (text or photo, optional single `categoryId`, `canvasX`/`canvasY` for board position, `isStub` for auto-created wikilink targets), `Category` (name + pastel `color`), `Link` (`sourceNoteId`/`targetNoteId`/`kind`, where `kind` is `"wikilink"` for auto-detected `[[Title]]` references or `"manual"` for connections drawn directly on the board/graph). Categories are single per note (not many-to-many) — the primary organizing axis is category color; cross-cutting connections between individual notes go through `Link`, not tags.

**Full-text search**: SQLite FTS5 virtual table `NoteSearch`, external-content-linked to `Note` via `rowid`, kept in sync with `AFTER INSERT/UPDATE/DELETE` triggers — all defined by hand in `prisma/migrations/20260703032153_fts_search/migration.sql` since Prisma doesn't model virtual tables/triggers itself. If `Note`'s schema changes, this migration's trigger bodies (`title, content` columns) need matching updates, and any future Prisma-managed migration must not be allowed to drop `NoteSearch`. The table uses the FTS5 **trigram** tokenizer (`prisma/migrations/20260703040000_fts_trigram/migration.sql`) rather than the default `unicode61`, because Korean text doesn't tokenize on whitespace/word boundaries the way the default tokenizer assumes. Trigram can't index anything under 3 characters, though, so `/api/search` falls back to a plain `contains` scan for short queries — don't remove that fallback, 1-2 character Korean words are common. Also note: FTS5 `MATCH` against a virtual table **must use the real table name**, not an alias, inside a JOIN (`WHERE "NoteSearch" MATCH ...`, not `WHERE s MATCH ...` after `"NoteSearch" s`) — aliasing it produces a runtime `no such column` error that Prisma's `$queryRaw` won't catch at compile time.

**Local data storage**: everything under `data/` (gitignored) — `data/notes.db` is the entire database, `data/uploads/` holds photo attachments. This is intentional: "copy the `data/` folder" is the whole backup story for a non-technical owner. Never point `DATABASE_URL` or upload storage outside this directory.

**Category color assignment**: `src/lib/palette.ts` holds the fixed 8-color pastel palette and `nextPaletteColor(existingCount)`, which round-robins by current category count. Used by `POST /api/categories` when no explicit color is supplied.

**Wikilinks**: implemented in `src/lib/wikilinks.ts`. `[[Note Title]]` in a note's `content` resolves/creates a `Link` row of kind `wikilink` (`syncWikilinks`, called from the notes POST/PATCH routes), auto-creating a stub `Note` (`isStub: true`, title-only, no content) if no note with that title exists yet — mirrors Obsidian's "linking creates the page." Title matching is case-insensitive via `COLLATE NOCASE` (Prisma's `mode: 'insensitive'` isn't supported on SQLite). Stub notes are excluded from normal listings (`isStub: false` filters in `/api/notes` and the homepage) until written into; writing non-empty content to a stub via `PATCH /api/notes/[id]` automatically clears `isStub`. Rendering turns `[[Title]]` into a real markdown link via `renderWikilinksAsMarkdown`, using a title→id map built from the note's own `outgoingLinks` — there's no custom remark plugin.

**Route param convention**: dynamic API routes use the Next.js 16 async params signature — `{ params }: { params: Promise<{ id: string }> }`, then `const { id } = await params`. This project's Next.js version has other breaking changes vs. older docs/training data too; check `node_modules/next/dist/docs/` before assuming an API shape (see AGENTS.md above).

**Graph view**: `/graph` renders `src/components/graph/GraphView.tsx` (react-force-graph-2d) via `GraphViewLoader.tsx`, a `next/dynamic(..., { ssr: false })` wrapper — the graph library touches canvas/`window` at import time and will break server-side rendering if imported directly into a page. Node color comes from category color (fallback lilac-gray for uncategorized); stub notes render as a dashed, semi-transparent circle via manual `nodeCanvasObject` drawing rather than the library's default node rendering.

**Board (canvas) drag**: `src/components/board/Canvas.tsx` uses `@dnd-kit/core`'s `useDraggable`; position updates go through `PATCH /api/notes/[id]` with `canvasX`/`canvasY` on drag end. New notes get an auto-assigned grid position (4 columns) computed server-side in `POST /api/notes` when the client doesn't supply explicit coordinates — see the `existingCount`-based math there if that grid ever needs adjusting.

## Status

All five planned milestones (M1–M5) are implemented: Prisma data layer + CRUD, quick-capture UI + canvas board + category management, wikilinks + full-text search, graph view + theme, and `start.command`/README/error-state hardening. The app is a working single-user local note tool; nothing beyond Phase 1 (multi-user, cloud, gamification) has been started, per the plan.
