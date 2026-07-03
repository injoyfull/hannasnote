"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CategoryChip from "@/components/shared/CategoryChip";

type Category = { id: string; name: string; color: string };

export default function NoteEditor({
  noteId,
  initialContent,
  initialCategoryId,
  categories,
}: {
  noteId: string;
  initialContent: string;
  initialCategoryId: string | null;
  categories: Category[];
}) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, categoryId }),
      });
      if (!res.ok) throw new Error("저장에 실패했어요. 다시 시도해주세요.");
      setDirty(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("이 노트를 삭제할까요? 되돌릴 수 없어요.")) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("삭제에 실패했어요. 다시 시도해주세요.");
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했어요.");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setDirty(true);
        }}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            save();
          }
        }}
        rows={8}
        placeholder="이 노트에 내용을 적어보세요... [[다른 노트 제목]]처럼 쓰면 연결됩니다."
        className="w-full resize-none rounded-xl border border-black/10 bg-white p-3 text-[15px] outline-none focus:border-[#4A6FA5]"
      />

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <CategoryChip
            key={c.id}
            category={c}
            selected={categoryId === c.id}
            onClick={() => {
              setCategoryId((prev) => (prev === c.id ? null : c.id));
              setDirty(true);
            }}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty}
          className="rounded-full bg-[#4A6FA5] px-5 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        >
          {saving ? "저장 중..." : dirty ? "저장 (⌘+Enter)" : "저장됨"}
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={deleting}
          className="rounded-full px-3 py-1.5 text-sm text-red-500/70 hover:text-red-600 disabled:opacity-40"
        >
          {deleting ? "삭제 중..." : "노트 삭제"}
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
