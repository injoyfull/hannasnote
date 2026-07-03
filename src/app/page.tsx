import Link from "next/link";
import { prisma } from "@/lib/prisma";
import QuickAddForm from "@/components/capture/QuickAddForm";

export default async function Home() {
  const [notes, categories] = await Promise.all([
    prisma.note.findMany({
      where: { isStub: false },
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.category.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>HANNAsNote (M1 동작 확인용 임시 화면)</h1>
      <QuickAddForm categories={categories} />

      <h2>최근 노트</h2>
      <ul>
        {notes.map((n) => (
          <li key={n.id}>
            <Link href={`/note/${n.id}`}>{n.title || n.content?.slice(0, 30) || "(사진)"}</Link>
            {n.category && (
              <span
                style={{
                  background: n.category.color,
                  padding: "2px 6px",
                  borderRadius: 8,
                  marginLeft: 8,
                  fontSize: 12,
                }}
              >
                {n.category.name}
              </span>
            )}
          </li>
        ))}
        {notes.length === 0 && <li>아직 노트가 없습니다.</li>}
      </ul>
    </main>
  );
}
