"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CategoryChip from "@/components/shared/CategoryChip";

type Category = { id: string; name: string; color: string };

export default function CaptureScreen({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function pickPhoto(file: File | null) {
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSave() {
    if (!content.trim() && !photoFile) return;
    setSaving(true);
    setError(null);
    try {
      let imagePath: string | null = null;
      if (photoFile) {
        const fd = new FormData();
        fd.append("file", photoFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: fd,
        });
        if (!uploadRes.ok) {
          const body = await uploadRes.json().catch(() => null);
          throw new Error(body?.error || "사진 업로드에 실패했어요.");
        }
        const uploaded = await uploadRes.json();
        imagePath = uploaded.imagePath;
      }

      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: photoFile ? "photo" : "text",
          content: content.trim() || null,
          imagePath,
          categoryId,
        }),
      });
      if (!res.ok) throw new Error("저장에 실패했어요. 다시 시도해주세요.");

      setContent("");
      pickPhoto(null);
      setCategoryId(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

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

  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-black/10 bg-white/70 p-5 shadow-sm">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            handleSave();
          }
        }}
        placeholder="생각, 문장, 단어를 적어보세요... (⌘+Enter로 저장)"
        rows={4}
        autoFocus
        className="w-full resize-none rounded-xl border border-black/10 bg-white p-3 text-[15px] outline-none focus:border-[#4A6FA5]"
      />

      {photoPreview && (
        <div className="mt-3 relative inline-block">
          <img
            src={photoPreview}
            alt="첨부한 사진 미리보기"
            className="max-h-48 rounded-xl border border-black/10"
          />
          <button
            type="button"
            onClick={() => pickPhoto(null)}
            className="absolute -right-2 -top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white"
          >
            제거
          </button>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {categories.map((c) => (
          <CategoryChip
            key={c.id}
            category={c}
            selected={categoryId === c.id}
            onClick={() =>
              setCategoryId((prev) => (prev === c.id ? null : c.id))
            }
          />
        ))}
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickPhoto(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
          >
            📷 사진 첨부
          </button>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || (!content.trim() && !photoFile)}
          className="rounded-full bg-[#4A6FA5] px-5 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-black/10 pt-3">
        <input
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
          placeholder="새 카테고리 이름"
          className="flex-1 rounded-full border border-black/10 px-3 py-1 text-sm outline-none focus:border-[#4A6FA5]"
        />
        <button
          type="button"
          onClick={handleAddCategory}
          className="rounded-full border border-black/10 px-3 py-1 text-sm hover:bg-zinc-50"
        >
          카테고리 추가
        </button>
      </div>
    </div>
  );
}
