import { prisma } from "@/lib/prisma";
import SearchScreen from "@/components/search/SearchScreen";
import { requireUserId } from "@/lib/auth";

export default async function SearchPage() {
  const userId = await requireUserId();
  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="px-4 py-8">
      <SearchScreen categories={categories} />
    </main>
  );
}
