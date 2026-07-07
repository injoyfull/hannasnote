"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  startOfDay,
  startOfWeek,
  subDays,
  endOfDay,
  formatDistanceToNow,
} from "date-fns";
import { ko } from "date-fns/locale";
import CategoryChip from "@/components/shared/CategoryChip";
import { noteThumbUrl } from "@/lib/images";

type Category = { id: string; name: string; color: string };
type Note = {
  id: string;
  title: string | null;
  content: string | null;
  imagePath: string | null;
  createdAt: string;
  category: Category | null;
};

type DateFilter = "all" | "today" | "yesterday" | "week";

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "today", label: "오늘" },
  { key: "yesterday", label: "어제" },
  { key: "week", label: "이번 주" },
];

function dateFilterRange(filter: DateFilter): { since?: string; until?: string } {
  const now = new Date();
  if (filter === "today") {
    return { since: startOfDay(now).toISOString() };
  }
  if (filter === "yesterday") {
    const y = subDays(now, 1);
    return { since: startOfDay(y).toISOString(), until: endOfDay(y).toISOString() };
  }
  if (filter === "week") {
    return { since: startOfWeek(now, { weekStartsOn: 1 }).toISOString() };
  }
  return {};
}

export default function SearchScreen({ categories }: { categories: Category[] }) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);

  const range = useMemo(() => dateFilterRange(dateFilter), [dateFilter]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (categoryId) params.set("categoryId", categoryId);
      if (range.since) params.set("since", range.since);
      if (range.until) params.set("until", range.until);

      try {
        const res = await fetch(`/api/search?${params.toString()}`);
        if (res.ok) setNotes(await res.json());
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, categoryId, range.since, range.until]);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="어제 적었던 그 문장을 찾아보세요..."
        autoFocus
        className="w-full rounded-full border border-black/10 bg-white px-4 py-2.5 text-[15px] outline-none focus:border-[#4A6FA5]"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {DATE_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setDateFilter(f.key)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              dateFilter === f.key
                ? "bg-[#4A6FA5] text-white"
                : "border border-black/10 bg-white text-[#3A3226]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {categories.map((c) => (
          <CategoryChip
            key={c.id}
            category={c}
            selected={categoryId === c.id}
            onClick={() => setCategoryId((prev) => (prev === c.id ? null : c.id))}
          />
        ))}
      </div>

      <ul className="mt-5 space-y-2">
        {notes.map((n) => (
          <li key={n.id}>
            <Link
              href={`/note/${n.id}`}
              className="flex items-center gap-3 rounded-xl border border-black/10 bg-white/70 px-4 py-3 hover:bg-white"
            >
              {n.imagePath && (
                <img
                  src={noteThumbUrl(n.imagePath)}
                  alt=""
                  className="h-10 w-10 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-[#3A3226]">
                  {n.title || n.content?.slice(0, 60) || "(사진)"}
                </p>
                <p className="text-xs text-[#3A3226]/50">
                  {formatDistanceToNow(new Date(n.createdAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </p>
              </div>
              {n.category && <CategoryChip category={n.category} />}
            </Link>
          </li>
        ))}
        {!loading && notes.length === 0 && (
          <li className="text-sm text-[#3A3226]/50">검색 결과가 없습니다.</li>
        )}
      </ul>
    </div>
  );
}
