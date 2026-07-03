import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function escapeFtsPhrase(q: string) {
  return `"${q.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const categoryId = searchParams.get("categoryId");
  const since = searchParams.get("since");
  const until = searchParams.get("until");

  if (!q) {
    const notes = await prisma.note.findMany({
      where: {
        isStub: false,
        ...(categoryId ? { categoryId } : {}),
        ...(since || until
          ? {
              createdAt: {
                ...(since ? { gte: new Date(since) } : {}),
                ...(until ? { lte: new Date(until) } : {}),
              },
            }
          : {}),
      },
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(notes);
  }

  // The FTS5 trigram tokenizer can't form a trigram from fewer than 3
  // characters, which makes MATCH behave unreliably for short queries —
  // and 1-2 character words are common in Korean. Fall back to a plain
  // substring scan for short queries instead of relying on the index.
  const dateWhere =
    since || until
      ? {
          createdAt: {
            ...(since ? { gte: new Date(since) } : {}),
            ...(until ? { lte: new Date(until) } : {}),
          },
        }
      : {};

  if ([...q].length < 3) {
    const notes = await prisma.note.findMany({
      where: {
        isStub: false,
        ...(categoryId ? { categoryId } : {}),
        ...dateWhere,
        OR: [{ title: { contains: q } }, { content: { contains: q } }],
      },
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json(notes);
  }

  const matchQuery = escapeFtsPhrase(q);
  const matched = await prisma.$queryRaw<{ id: string }[]>`
    SELECT n.id as id
    FROM "Note" n
    JOIN "NoteSearch" ON n.rowid = "NoteSearch".rowid
    WHERE "NoteSearch" MATCH ${matchQuery}
    ORDER BY rank
    LIMIT 200
  `;
  const ids = matched.map((m) => m.id);
  if (ids.length === 0) return NextResponse.json([]);

  const notes = await prisma.note.findMany({
    where: {
      id: { in: ids },
      isStub: false,
      ...(categoryId ? { categoryId } : {}),
      ...dateWhere,
    },
    include: { category: true },
  });

  const rankOrder = new Map(ids.map((id, i) => [id, i]));
  notes.sort(
    (a, b) => (rankOrder.get(a.id) ?? 0) - (rankOrder.get(b.id) ?? 0),
  );

  return NextResponse.json(notes);
}
