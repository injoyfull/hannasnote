import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CaptureScreen from "@/components/capture/CaptureScreen";
import CategoryChip from "@/components/shared/CategoryChip";

export default async function Home() {
  const [notes, categories] = await Promise.all([
    prisma.note.findMany({
      where: { isStub: false },
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.category.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <CaptureScreen categories={categories} />

      <h2 className="mt-8 mb-3 text-sm font-semibold text-[#3A3226]/70">
        최근 노트
      </h2>
      <ul className="space-y-2">
        {notes.map((n) => (
          <li key={n.id}>
            <Link
              href={`/note/${n.id}`}
              className="flex items-center gap-2 rounded-xl border border-black/10 bg-white/70 px-4 py-3 hover:bg-white"
            >
              {n.imagePath && (
                <img
                  src={`/api/uploads/${n.imagePath.replace(/(\.[a-z]+)$/i, "_thumb$1")}`}
                  alt=""
                  className="h-10 w-10 rounded-lg object-cover"
                />
              )}
              <span className="flex-1 truncate text-sm text-[#3A3226]">
                {n.title || n.content?.slice(0, 60) || "(사진)"}
              </span>
              {n.category && (
                <CategoryChip category={n.category} />
              )}
            </Link>
          </li>
        ))}
        {notes.length === 0 && (
          <li className="text-sm text-[#3A3226]/60">
            아직 노트가 없습니다. 위에서 첫 생각을 적어보세요.
          </li>
        )}
      </ul>
    </main>
  );
}
