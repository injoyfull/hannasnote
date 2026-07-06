"use client";

import Link from "next/link";
import { vividize } from "@/lib/color";
import { UNCATEGORIZED_COLOR } from "@/lib/palette";

type Note = {
  id: string;
  title: string | null;
  content: string | null;
  category: { name: string; color: string } | null;
  createdAt: string;
  isStub: boolean;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export default function NoteTable({ notes }: { notes: Note[] }) {
  const rows = notes
    .filter((n) => !n.isStub)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-[#FFFBEA]/50">
            <th className="w-32 py-2 pr-3 font-normal">카테고리</th>
            <th className="py-2 pr-3 font-normal">노트</th>
            <th className="w-24 py-2 pr-3 font-normal">날짜</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((n) => {
            const color = vividize(n.category?.color ?? UNCATEGORIZED_COLOR);
            return (
              <tr key={n.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-2.5 pr-3">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs"
                    style={{ backgroundColor: `${color}33`, color: "#FFFBEA" }}
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {n.category?.name ?? "미분류"}
                  </span>
                </td>
                <td className="py-2.5 pr-3">
                  <Link
                    href={`/note/${n.id}`}
                    className="text-[#FFFBEA]/90 hover:text-[#F0C987]"
                  >
                    {n.title || n.content?.slice(0, 60) || "(사진)"}
                  </Link>
                </td>
                <td className="py-2.5 pr-3 text-xs text-[#FFFBEA]/40">
                  {formatDate(n.createdAt)}
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} className="py-8 text-center text-[#FFFBEA]/40">
                아직 노트가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
