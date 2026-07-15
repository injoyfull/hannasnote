import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const userId = await getApiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const categoryId = searchParams.get("categoryId");
  const since = searchParams.get("since");
  const until = searchParams.get("until");

  const dateWhere =
    since || until
      ? {
          createdAt: {
            ...(since ? { gte: new Date(since) } : {}),
            ...(until ? { lte: new Date(until) } : {}),
          },
        }
      : {};

  // Postgres pg_trgm GIN indexes on title/content make case-insensitive
  // substring search (ILIKE via Prisma `contains` + mode:'insensitive') fast,
  // including for Korean. No separate FTS table needed.
  const notes = await prisma.note.findMany({
    where: {
      userId,
      isStub: false,
      ...(categoryId ? { categoryId } : {}),
      ...dateWhere,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { content: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(notes);
}
