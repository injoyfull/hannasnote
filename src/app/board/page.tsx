import { prisma } from "@/lib/prisma";
import Canvas from "@/components/board/CanvasLoader";

export default async function BoardPage() {
  const notes = await prisma.note.findMany({
    where: { isStub: false },
    include: { category: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="overflow-auto">
      <Canvas notes={notes} />
    </main>
  );
}
