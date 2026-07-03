import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const MAX_FILE_BYTES = 25 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "이미지 파일만 첨부할 수 있어요." },
      { status: 400 },
    );
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "사진 크기가 너무 커요 (25MB 이하로 첨부해주세요)." },
      { status: 400 },
    );
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const id = randomUUID();
  const buffer = Buffer.from(await file.arrayBuffer());

  const originalName = `${id}.jpg`;
  const thumbName = `${id}_thumb.jpg`;

  try {
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
  } catch {
    return NextResponse.json(
      { error: "사진을 처리하지 못했어요. 다른 사진으로 시도해주세요." },
      { status: 400 },
    );
  }

  return NextResponse.json({ imagePath: originalName, thumbPath: thumbName });
}
