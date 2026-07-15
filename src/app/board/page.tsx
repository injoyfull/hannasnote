import { prisma } from "@/lib/prisma";
import Canvas from "@/components/board/CanvasLoader";
import { requireUserId } from "@/lib/auth";

export default async function BoardPage() {
  const userId = await requireUserId();
  const notes = await prisma.note.findMany({
    where: { userId, isStub: false },
    include: { category: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="overflow-auto">
      <Canvas notes={notes} />
    </main>
  );
}
