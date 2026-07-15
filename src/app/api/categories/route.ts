import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nextPaletteColor } from "@/lib/palette";
import { getApiUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getApiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const userId = await getApiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const existingCount = await prisma.category.count({ where: { userId } });
  const color =
    typeof body.color === "string" && body.color
      ? body.color
      : nextPaletteColor(existingCount);

  const category = await prisma.category.create({
    data: { userId, name, color },
  });

  return NextResponse.json(category, { status: 201 });
}
