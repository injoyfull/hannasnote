import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nextPaletteColor } from "@/lib/palette";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const existingCount = await prisma.category.count();
  const color =
    typeof body.color === "string" && body.color
      ? body.color
      : nextPaletteColor(existingCount);

  const category = await prisma.category.create({
    data: { name, color },
  });

  return NextResponse.json(category, { status: 201 });
}
