"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  useDraggable,
  type DragEndEvent,
} from "@dnd-kit/core";
import Starfield, { COSMIC_BG } from "@/components/shared/Starfield";
import { hexToRgba, vividize } from "@/lib/color";
import { UNCATEGORIZED_COLOR } from "@/lib/palette";

type Category = { id: string; name: string; color: string };
type Note = {
  id: string;
  type: string;
  title: string | null;
  content: string | null;
  imagePath: string | null;
  canvasX: number;
  canvasY: number;
  category: Category | null;
};

const CARD_WIDTH = 220;

function Card({ note }: { note: Note }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: note.id });

  const glow = vividize(note.category?.color ?? UNCATEGORIZED_COLOR);

  const style: React.CSSProperties = {
    position: "absolute",
    left: note.canvasX,
    top: note.canvasY,
    width: CARD_WIDTH,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    background: `linear-gradient(160deg, ${hexToRgba(glow, 0.28)}, rgba(255,255,255,0.05))`,
    borderColor: hexToRgba(glow, 0.6),
    boxShadow: `0 0 22px ${hexToRgba(glow, 0.3)}, inset 0 0 16px rgba(255,255,255,0.04)`,
    zIndex: isDragging ? 50 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="rounded-2xl border p-3 backdrop-blur-sm transition-shadow select-none hover:brightness-110"
    >
      {note.imagePath && (
        <img
          src={`/api/uploads/${note.imagePath.replace(/(\.[a-z]+)$/i, "_thumb$1")}`}
          alt=""
          className="mb-2 h-28 w-full rounded-lg object-cover"
          draggable={false}
        />
      )}
      {note.content && (
        <p className="text-sm text-[#FFFBEA] line-clamp-5 whitespace-pre-wrap">
          {note.title || note.content}
        </p>
      )}
      <a
        href={`/note/${note.id}`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className="mt-2 inline-block text-xs text-[#F0C987] underline"
      >
        열기
      </a>
    </div>
  );
}

export default function Canvas({ notes: initialNotes }: { notes: Note[] }) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);

  async function handleDragEnd(e: DragEndEvent) {
    const { active, delta } = e;
    const note = notes.find((n) => n.id === active.id);
    if (!note) return;

    const canvasX = Math.max(0, Math.round(note.canvasX + delta.x));
    const canvasY = Math.max(0, Math.round(note.canvasY + delta.y));

    setNotes((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, canvasX, canvasY } : n)),
    );

    await fetch(`/api/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canvasX, canvasY }),
    });
    router.refresh();
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div
        className="relative min-h-[1400px] min-w-[1400px]"
        style={{ background: COSMIC_BG }}
      >
        <Starfield count={260} />
        {notes.map((note) => (
          <Card key={note.id} note={note} />
        ))}
        {notes.length === 0 && (
          <p className="relative p-8 text-sm text-[#FFFBEA]/60">
            아직 보드에 놓을 노트가 없습니다. 캡쳐 화면에서 먼저 기록해보세요.
          </p>
        )}
      </div>
    </DndContext>
  );
}
