import { prisma } from "@/lib/prisma";
import CategoriesManager from "@/components/categories/CategoriesManager";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="px-4 py-8">
      <CategoriesManager categories={categories} />
    </main>
  );
}
