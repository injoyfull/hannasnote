import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const id = randomUUID();
  const buffer = Buffer.from(await file.arrayBuffer());

  const originalName = `${id}.jpg`;
  const thumbName = `${id}_thumb.jpg`;

  const image = sharp(buffer).rotate();
  await image
    .clone()
    .jpeg({ quality: 88 })
    .toFile(path.join(UPLOAD_DIR, originalName));
  await image
    .clone()
    .resize({ width: 480, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(path.join(UPLOAD_DIR, thumbName));

  return NextResponse.json({ imagePath: originalName, thumbPath: thumbName });
}
