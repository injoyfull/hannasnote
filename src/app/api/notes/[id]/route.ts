import { NextRequest, NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { syncWikilinks } from "@/lib/wikilinks";
import { getApiUserId } from "@/lib/auth";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getApiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const note = await prisma.note.findFirst({
    where: { id, userId },
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
  const userId = await getApiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  // Ownership check before mutating.
  const owned = await prisma.note.findFirst({ where: { id, userId }, select: { id: true } });
  if (!owned) return NextResponse.json({ error: "not found" }, { status: 404 });

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
    await syncWikilinks(userId, note.id, data.content);
  }

  return NextResponse.json(note);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getApiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const owned = await prisma.note.findFirst({ where: { id, userId }, select: { id: true } });
  if (!owned) return NextResponse.json({ error: "not found" }, { status: 404 });

  const note = await prisma.note.delete({ where: { id } });

  if (note.imagePath) {
    const thumbPath = note.imagePath.replace(/(\.[a-z]+)$/i, "_thumb$1");
    const targets = [note.imagePath, thumbPath];

    if (/^https?:\/\//.test(note.imagePath)) {
      // Cloud (Vercel Blob) — delete by URL.
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        await del(targets).catch(() => {});
      }
    } else {
      // Local dev filesystem.
      await Promise.all(
        targets.map((name) =>
          unlink(path.join(UPLOAD_DIR, name)).catch(() => {}),
        ),
      );
    }
  }

  return NextResponse.json({ ok: true });
}
