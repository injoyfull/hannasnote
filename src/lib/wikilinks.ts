import { prisma } from "@/lib/prisma";

const WIKILINK_RE = /\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;

/**
 * Rewrites [[Title]] (and [[Title|label]]) into standard markdown links
 * pointing at /note/<id>, using a title(lowercased)->id lookup. Intended for
 * rendering a note's content with react-markdown after wikilinks have
 * already been synced (so every title in the map has a real or stub note).
 */
export function renderWikilinksAsMarkdown(
  content: string,
  titleToId: Map<string, string>,
): string {
  return content.replace(WIKILINK_RE, (full, rawTitle: string) => {
    const pipeIndex = full.indexOf("|");
    const title = rawTitle.trim();
    const label =
      pipeIndex >= 0 ? full.slice(pipeIndex + 1, -2).trim() : title;
    const id = titleToId.get(title.toLowerCase());
    return id ? `[${label}](/note/${id})` : label;
  });
}

export function extractWikilinkTitles(content: string | null): string[] {
  if (!content) return [];
  const titles = new Set<string>();
  for (const match of content.matchAll(WIKILINK_RE)) {
    const title = match[1].trim();
    if (title) titles.add(title);
  }
  return [...titles];
}

async function resolveOrCreateStub(
  userId: string,
  title: string,
): Promise<string> {
  // Case-insensitive title match, scoped to this user (Postgres mode:
  // 'insensitive' replaces the old SQLite COLLATE NOCASE).
  const existing = await prisma.note.findFirst({
    where: { userId, title: { equals: title, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) return existing.id;

  const stub = await prisma.note.create({
    data: { userId, type: "text", title, isStub: true },
  });
  return stub.id;
}

/**
 * Keeps a note's outgoing wikilinks in sync with the [[Title]] references in
 * its content: resolves each title to a note owned by the same user (creating
 * an empty stub if none exists yet, Obsidian-style), then diffs against
 * existing wikilink Links so removed references stop showing up.
 */
export async function syncWikilinks(
  userId: string,
  noteId: string,
  content: string | null,
) {
  const titles = extractWikilinkTitles(content);
  const desiredTargetIds = new Set<string>();
  for (const title of titles) {
    const targetId = await resolveOrCreateStub(userId, title);
    if (targetId !== noteId) desiredTargetIds.add(targetId);
  }

  const existingLinks = await prisma.link.findMany({
    where: { sourceNoteId: noteId, kind: "wikilink" },
    select: { id: true, targetNoteId: true },
  });
  const existingTargetIds = new Set(existingLinks.map((l) => l.targetNoteId));

  const toDelete = existingLinks.filter(
    (l) => !desiredTargetIds.has(l.targetNoteId),
  );
  const toCreate = [...desiredTargetIds].filter(
    (id) => !existingTargetIds.has(id),
  );

  await prisma.$transaction([
    ...toDelete.map((l) => prisma.link.delete({ where: { id: l.id } })),
    ...toCreate.map((targetNoteId) =>
      prisma.link.create({
        data: { userId, sourceNoteId: noteId, targetNoteId, kind: "wikilink" },
      }),
    ),
  ]);
}
