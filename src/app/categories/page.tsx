import { prisma } from "@/lib/prisma";
import CategoriesManager from "@/components/categories/CategoriesManager";
import { requireUserId } from "@/lib/auth";

export default async function CategoriesPage() {
  const userId = await requireUserId();
  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="px-4 py-8">
      <CategoriesManager categories={categories} />
    </main>
  );
}
