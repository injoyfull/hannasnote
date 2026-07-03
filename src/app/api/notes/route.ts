import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  const note = await prisma.note.create({
    data: {
      type,
      title,
      content,
      imagePath,
      categoryId,
      canvasX: typeof body.canvasX === "number" ? body.canvasX : 0,
      canvasY: typeof body.canvasY === "number" ? body.canvasY : 0,
    },
    include: { category: true },
  });

  return NextResponse.json(note, { status: 201 });
}
