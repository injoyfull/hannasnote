import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncWikilinks } from "@/lib/wikilinks";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const note = await prisma.note.findUnique({
    where: { id },
    include: {
      category: true,
      incomingLinks: {
        include: { sourceNote: { include: { category: true } } },
      },
      outgoingLinks: {
        include: { targetNote: { include: { category: true } } },
      },
    },
  });

  if (!note) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(note);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (typeof body.title === "string") data.title = body.title.trim() || null;
  if (typeof body.content === "string") data.content = body.content;
  if (typeof body.imagePath === "string" || body.imagePath === null)
    data.imagePath = body.imagePath;
  if (typeof body.categoryId === "string" || body.categoryId === null)
    data.categoryId = body.categoryId;
  if (typeof body.canvasX === "number") data.canvasX = body.canvasX;
  if (typeof body.canvasY === "number") data.canvasY = body.canvasY;
  if (body.isStub === false) data.isStub = false;
  if (typeof data.content === "string" && data.content.trim())
    data.isStub = false;

  const note = await prisma.note.update({
    where: { id },
    data,
    include: { category: true },
  });

  if (typeof data.content === "string") {
    await syncWikilinks(note.id, data.content);
  }

  return NextResponse.json(note);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.note.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
