import { prisma } from "@/lib/prisma";
import GraphView from "@/components/graph/GraphViewLoader";

export default async function GraphPage() {
  const [notes, links] = await Promise.all([
    prisma.note.findMany({ include: { category: true } }),
    prisma.link.findMany(),
  ]);

  const graphNodes = notes.map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    color: n.category?.color ?? "#E3D9F0",
    isStub: n.isStub,
  }));
  const graphLinks = links.map((l) => ({
    source: l.sourceNoteId,
    target: l.targetNoteId,
    kind: l.kind,
  }));

  return (
    <main className="px-4 py-6">
      {graphNodes.length === 0 ? (
        <p className="text-sm text-[#3A3226]/60">
          아직 노트가 없습니다. 캡쳐 화면에서 먼저 기록해보세요.
        </p>
      ) : (
        <GraphView nodes={graphNodes} links={graphLinks} />
      )}
    </main>
  );
}
