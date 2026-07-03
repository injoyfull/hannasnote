import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const note = await prisma.note.findUnique({
    where: { id },
    include: {
      category: true,
      incomingLinks: { include: { sourceNote: true } },
      outgoingLinks: { include: { targetNote: true } },
    },
  });

  if (!note) notFound();

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <p>
        <Link href="/">← 목록으로</Link>
      </p>
      <h1>{note.title || "(제목 없음)"}</h1>
      <p>
        카테고리:{" "}
        {note.category ? (
          <span
            style={{
              background: note.category.color,
              padding: "2px 8px",
              borderRadius: 8,
            }}
          >
            {note.category.name}
          </span>
        ) : (
          "없음"
        )}
      </p>
      {note.imagePath && (
        <img
          src={`/api/uploads/${note.imagePath}`}
          alt=""
          style={{ maxWidth: 400 }}
        />
      )}
      <pre style={{ whiteSpace: "pre-wrap" }}>{note.content}</pre>

      <h3>백링크 (이 노트를 가리키는 노트)</h3>
      <ul>
        {note.incomingLinks.map((l) => (
          <li key={l.id}>
            <Link href={`/note/${l.sourceNote.id}`}>
              {l.sourceNote.title || l.sourceNote.id}
            </Link>{" "}
            ({l.kind})
          </li>
        ))}
        {note.incomingLinks.length === 0 && <li>없음</li>}
      </ul>

      <h3>이 노트가 가리키는 노트</h3>
      <ul>
        {note.outgoingLinks.map((l) => (
          <li key={l.id}>
            <Link href={`/note/${l.targetNote.id}`}>
              {l.targetNote.title || l.targetNote.id}
            </Link>{" "}
            ({l.kind})
          </li>
        ))}
        {note.outgoingLinks.length === 0 && <li>없음</li>}
      </ul>
    </main>
  );
}
