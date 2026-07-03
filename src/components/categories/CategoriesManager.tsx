"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_PALETTE } from "@/lib/palette";

type Category = { id: string; name: string; color: string };

function CategoryRow({ category }: { category: Category }) {
  const router = useRouter();
  const [name, setName] = useState(category.name);
  const [pickerOpen, setPickerOpen] = useState(false);

  async function saveName() {
    if (!name.trim() || name.trim() === category.name) {
      setName(category.name);
      return;
    }
    await fetch(`/api/categories/${category.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    router.refresh();
  }

  async function pickColor(color: string) {
    setPickerOpen(false);
    await fetch(`/api/categories/${category.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color }),
    });
    router.refresh();
  }

  async function remove() {
    if (!confirm(`"${category.name}" 카테고리를 삭제할까요? 이 카테고리를 쓰던 노트는 카테고리 없음이 됩니다.`)) return;
    await fetch(`/api/categories/${category.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white/70 px-4 py-3">
      <div className="relative">
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          style={{ backgroundColor: category.color }}
          className="h-7 w-7 rounded-full border border-black/10"
          aria-label="색상 변경"
        />
        {pickerOpen && (
          <div className="absolute z-10 mt-2 flex flex-wrap gap-1 rounded-xl border border-black/10 bg-white p-2 shadow-md w-40">
            {CATEGORY_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => pickColor(c)}
                style={{ backgroundColor: c }}
                className="h-6 w-6 rounded-full border border-black/10"
              />
            ))}
          </div>
        )}
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={saveName}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        className="flex-1 bg-transparent text-sm outline-none"
      />
      <button
        type="button"
        onClick={remove}
        className="text-xs text-red-500/70 hover:text-red-600"
      >
        삭제
      </button>
    </div>
  );
}

export default function CategoriesManager({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const [newName, setNewName] = useState("");

  async function addCategory() {
    if (!newName.trim()) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      setNewName("");
      router.refresh();
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-2">
      {categories.map((c) => (
        <CategoryRow key={c.id} category={c} />
      ))}
      {categories.length === 0 && (
        <p className="text-sm text-[#3A3226]/60">아직 카테고리가 없습니다.</p>
      )}

      <div className="flex items-center gap-2 pt-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCategory()}
          placeholder="새 카테고리 이름"
          className="flex-1 rounded-full border border-black/10 px-3 py-1.5 text-sm outline-none focus:border-[#4A6FA5]"
        />
        <button
          type="button"
          onClick={addCategory}
          className="rounded-full bg-[#4A6FA5] px-4 py-1.5 text-sm font-medium text-white"
        >
          추가
        </button>
      </div>
    </div>
  );
}
