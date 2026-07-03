import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncWikilinks } from "@/lib/wikilinks";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const since = searchParams.get("since"); // ISO date string
  const until = searchParams.get("until"); // ISO date string

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
  });

  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const type = body.type === "photo" ? "photo" : "text";
  const content = typeof body.content === "string" ? body.content : null;
  const title = typeof body.title === "string" ? body.title.trim() : null;
  const imagePath = typeof body.imagePath === "string" ? body.imagePath : null;
  const categoryId = typeof body.categoryId === "string" ? body.categoryId : null;

  if (!content && !imagePath) {
    return NextResponse.json(
      { error: "content or imagePath is required" },
      { status: 400 },
    );
  }

  let canvasX = body.canvasX;
  let canvasY = body.canvasY;
  if (typeof canvasX !== "number" || typeof canvasY !== "number") {
    const existingCount = await prisma.note.count({ where: { isStub: false } });
    const col = existingCount % 4;
    const row = Math.floor(existingCount / 4);
    canvasX = 40 + col * 260;
    canvasY = 40 + row * 200;
  }

  const note = await prisma.note.create({
    data: {
      type,
      title,
      content,
      imagePath,
      categoryId,
      canvasX,
      canvasY,
    },
    include: { category: true },
  });

  if (content) await syncWikilinks(note.id, content);

  return NextResponse.json(note, { status: 201 });
}
