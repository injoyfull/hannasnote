import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { put } from "@vercel/blob";
import { getApiUserId } from "@/lib/auth";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const MAX_FILE_BYTES = 25 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const userId = await getApiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

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

  const id = randomUUID();
  const originalName = `${id}.jpg`;
  const thumbName = `${id}_thumb.jpg`;
  const inputBuffer = Buffer.from(await file.arrayBuffer());

  let originalOut: Buffer;
  let thumbOut: Buffer;
  try {
    const image = sharp(inputBuffer).rotate();
    originalOut = await image.clone().jpeg({ quality: 88 }).toBuffer();
    thumbOut = await image
      .clone()
      .resize({ width: 480, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch {
    return NextResponse.json(
      { error: "사진을 처리하지 못했어요. 다른 사진으로 시도해주세요." },
      { status: 400 },
    );
  }

  // Cloud (Vercel Blob) when a token is present; otherwise local filesystem for dev.
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const [original, thumb] = await Promise.all([
        put(`notes/${originalName}`, originalOut, {
          access: "public",
          contentType: "image/jpeg",
          addRandomSuffix: false,
        }),
        put(`notes/${thumbName}`, thumbOut, {
          access: "public",
          contentType: "image/jpeg",
          addRandomSuffix: false,
        }),
      ]);
      // Store the full Blob URL; noteThumbUrl() derives the thumb URL by swapping
      // the extension suffix, which holds because both blobs share the same base.
      return NextResponse.json({
        imagePath: original.url,
        thumbPath: thumb.url,
      });
    } catch {
      return NextResponse.json(
        { error: "사진을 업로드하지 못했어요. 다시 시도해주세요." },
        { status: 500 },
      );
    }
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  await Promise.all([
    writeFile(path.join(UPLOAD_DIR, originalName), originalOut),
    writeFile(path.join(UPLOAD_DIR, thumbName), thumbOut),
  ]);
  return NextResponse.json({ imagePath: originalName, thumbPath: thumbName });
}
