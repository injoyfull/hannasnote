import { prisma } from "@/lib/prisma";
import SearchScreen from "@/components/search/SearchScreen";

export default async function SearchPage() {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="px-4 py-8">
      <SearchScreen categories={categories} />
    </main>
  );
}
