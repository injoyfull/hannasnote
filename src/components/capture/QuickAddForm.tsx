"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Category = { id: string; name: string; color: string };

export default function QuickAddForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName.trim() }),
    });
    if (res.ok) {
      setNewCategoryName("");
      router.refresh();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "text",
        content,
        categoryId: categoryId || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setContent("");
      router.refresh();
    }
  }

  return (
    <div style={{ border: "1px solid #ccc", padding: 12, marginBottom: 24 }}>
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="생각, 문장, 단어를 적어보세요..."
          rows={3}
          style={{ width: "100%" }}
        />
        <div style={{ marginTop: 8 }}>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">카테고리 없음</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button type="submit" disabled={saving} style={{ marginLeft: 8 }}>
            저장
          </button>
        </div>
      </form>

      <div style={{ marginTop: 12 }}>
        <input
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="새 카테고리 이름"
        />
        <button type="button" onClick={handleAddCategory} style={{ marginLeft: 8 }}>
          카테고리 추가
        </button>
      </div>
    </div>
  );
}
