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

For daily non-technical use, `start.command` (once added per the M5 milestone) double-clicks to run `scripts/dev.sh` and open the browser — see plan M5.

## Architecture

**Stack**: Next.js App Router + TypeScript, Prisma 7 + SQLite (via `better-sqlite3` driver adapter), Tailwind CSS. One process, no separate backend.

**Prisma 7 specifics (this bit differs from most Prisma docs/training data)**: the generator uses `provider = "prisma-client"` (not the classic `prisma-client-js`) and outputs to `src/generated/prisma/` — import from `@/generated/prisma/client`, not `@prisma/client`. The generated client requires an explicit **driver adapter**; passing `datasourceUrl` to `new PrismaClient()` throws (`Unknown property datasourceUrl`). See `src/lib/prisma.ts` — it builds a `PrismaBetterSqlite3` adapter from `DATABASE_URL`, stripping the `file:` prefix since the adapter wants a plain filesystem path. `DATABASE_URL` in `.env` (`file:./data/notes.db`) is resolved relative to the project root (`prisma.config.ts`'s cwd), **not** relative to `prisma/schema.prisma` — don't use `../data/...`.

**Data model** (`prisma/schema.prisma`): `Note` (text or photo, optional single `categoryId`, `canvasX`/`canvasY` for board position, `isStub` for auto-created wikilink targets), `Category` (name + pastel `color`), `Link` (`sourceNoteId`/`targetNoteId`/`kind`, where `kind` is `"wikilink"` for auto-detected `[[Title]]` references or `"manual"` for connections drawn directly on the board/graph). Categories are single per note (not many-to-many) — the primary organizing axis is category color; cross-cutting connections between individual notes go through `Link`, not tags.

**Full-text search**: SQLite FTS5 virtual table `NoteSearch`, external-content-linked to `Note` via `rowid`, kept in sync with `AFTER INSERT/UPDATE/DELETE` triggers — all defined by hand in `prisma/migrations/20260703032153_fts_search/migration.sql` since Prisma doesn't model virtual tables/triggers itself. If `Note`'s schema changes, this migration's trigger bodies (`title, content` columns) need matching updates, and any future Prisma-managed migration must not be allowed to drop `NoteSearch`.

**Local data storage**: everything under `data/` (gitignored) — `data/notes.db` is the entire database, `data/uploads/` holds photo attachments. This is intentional: "copy the `data/` folder" is the whole backup story for a non-technical owner. Never point `DATABASE_URL` or upload storage outside this directory.

**Category color assignment**: `src/lib/palette.ts` holds the fixed 8-color pastel palette and `nextPaletteColor(existingCount)`, which round-robins by current category count. Used by `POST /api/categories` when no explicit color is supplied.

**Wikilinks**: `[[Note Title]]` in a note's `content` should (per plan, not yet implemented as of M1) resolve/create a `Link` row of kind `wikilink`, auto-creating a stub `Note` (`isStub: true`) if no note with that title exists yet — mirrors Obsidian's "linking creates the page." Stub notes are excluded from normal listings (`isStub: false` filters in `/api/notes` and the homepage) until written into.

**Route param convention**: dynamic API routes use the Next.js 16 async params signature — `{ params }: { params: Promise<{ id: string }> }`, then `const { id } = await params`. This project's Next.js version has other breaking changes vs. older docs/training data too; check `node_modules/next/dist/docs/` before assuming an API shape (see AGENTS.md above).

## Status

Following the milestone breakdown in the plan (M1–M5): M1 (Prisma data layer + basic CRUD + bare note detail/list pages) is functional — `/api/notes`, `/api/categories` (with `[id]` variants), and unstyled `/` + `/note/[id]` pages exist. M2 (real quick-capture UI + freeform canvas board), M3 (search UI + wikilink parsing), M4 (graph view + the butter-yellow/blue/pastel theme), and M5 (`start.command`, README, hardening) are not started — the current homepage/QuickAddForm is a throwaway CRUD-verification scaffold, expected to be replaced during M2.
