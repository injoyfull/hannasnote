import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { prisma } from "@/lib/prisma";
import { renderWikilinksAsMarkdown } from "@/lib/wikilinks";
import NoteEditor from "@/components/note/NoteEditor";
import CategoryChip from "@/components/shared/CategoryChip";

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [note, categories] = await Promise.all([
    prisma.note.findUnique({
      where: { id },
      include: {
        category: true,
        incomingLinks: { include: { sourceNote: { include: { category: true } } } },
        outgoingLinks: { include: { targetNote: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  if (!note) notFound();

  const titleToId = new Map(
    note.outgoingLinks
      .filter((l) => l.kind === "wikilink")
      .map((l) => [l.targetNote.title?.toLowerCase() ?? "", l.targetNote.id]),
  );
  const renderedMarkdown = note.content
    ? renderWikilinksAsMarkdown(note.content, titleToId)
    : "";

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <p className="mb-4 text-sm">
        <Link href="/" className="text-[#4A6FA5]">
          ← 목록으로
        </Link>
      </p>

      {note.isStub && (
        <p className="mb-3 rounded-lg bg-black/5 px-3 py-2 text-sm text-[#3A3226]/70">
          아직 비어있는 노트입니다 (다른 노트에서 링크되어 자동으로 생겼어요). 아래에 내용을 적어보세요.
        </p>
      )}

      <h1 className="font-heading mb-2 text-2xl font-bold text-[#3A3226]">
        {note.title || "(제목 없음)"}
      </h1>

      {note.imagePath && (
        <img
          src={`/api/uploads/${note.imagePath}`}
          alt=""
          className="mb-4 max-h-96 rounded-xl border border-black/10"
        />
      )}

      {note.content && !note.isStub && (
        <div className="note-content mb-4 rounded-xl border border-black/10 bg-white/70 p-4 text-[15px] text-[#3A3226]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {renderedMarkdown}
          </ReactMarkdown>
        </div>
      )}

      <NoteEditor
        noteId={note.id}
        initialContent={note.content ?? ""}
        initialCategoryId={note.categoryId}
        categories={categories}
      />

      <section className="mt-8 border-t border-black/10 pt-4">
        <h3 className="mb-2 text-sm font-semibold text-[#3A3226]/70">
          백링크 (이 노트를 가리키는 노트)
        </h3>
        <ul className="space-y-1">
          {note.incomingLinks.map((l) => (
            <li key={l.id} className="flex items-center gap-2 text-sm">
              <Link href={`/note/${l.sourceNote.id}`} className="text-[#4A6FA5]">
                {l.sourceNote.title || l.sourceNote.content?.slice(0, 30) || l.sourceNote.id}
              </Link>
              {l.sourceNote.category && <CategoryChip category={l.sourceNote.category} />}
            </li>
          ))}
          {note.incomingLinks.length === 0 && (
            <li className="text-sm text-[#3A3226]/50">없음</li>
          )}
        </ul>
      </section>

      <section className="mt-4 pt-2">
        <h3 className="mb-2 text-sm font-semibold text-[#3A3226]/70">
          이 노트가 가리키는 노트
        </h3>
        <ul className="space-y-1">
          {note.outgoingLinks.map((l) => (
            <li key={l.id} className="text-sm">
              <Link href={`/note/${l.targetNote.id}`} className="text-[#4A6FA5]">
                {l.targetNote.title || l.targetNote.id}
              </Link>
            </li>
          ))}
          {note.outgoingLinks.length === 0 && (
            <li className="text-sm text-[#3A3226]/50">없음</li>
          )}
        </ul>
      </section>
    </main>
  );
}
