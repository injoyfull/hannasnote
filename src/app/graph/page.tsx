import { prisma } from "@/lib/prisma";
import GraphSection from "@/components/graph/GraphSection";
import { UNCATEGORIZED_COLOR } from "@/lib/palette";

export default async function GraphPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { new: highlightId } = await searchParams;

  const [notes, links] = await Promise.all([
    prisma.note.findMany({ include: { category: true } }),
    prisma.link.findMany(),
  ]);

  const graphNodes = notes.map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    color: n.category?.color ?? UNCATEGORIZED_COLOR,
    isStub: n.isStub,
  }));
  const graphLinks = links.map((l) => ({
    source: l.sourceNoteId,
    target: l.targetNoteId,
    kind: l.kind,
  }));
  const tableNotes = notes.map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    category: n.category ? { name: n.category.name, color: n.category.color } : null,
    createdAt: n.createdAt.toISOString(),
    isStub: n.isStub,
  }));

  return (
    <main>
      {graphNodes.length === 0 ? (
        <p className="p-6 text-sm text-[#3A3226]/60">
          아직 노트가 없습니다. 캡쳐 화면에서 먼저 기록해보세요.
        </p>
      ) : (
        <GraphSection
          graphNodes={graphNodes}
          graphLinks={graphLinks}
          tableNotes={tableNotes}
          highlightId={highlightId}
        />
      )}
    </main>
  );
}
