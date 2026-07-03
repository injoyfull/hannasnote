import { prisma } from "@/lib/prisma";
import Canvas from "@/components/board/Canvas";

export default async function BoardPage() {
  const notes = await prisma.note.findMany({
    where: { isStub: false },
    include: { category: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="overflow-auto p-6">
      <Canvas notes={notes} />
    </main>
  );
}
