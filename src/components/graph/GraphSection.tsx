"use client";

import { useState } from "react";
import GraphView from "@/components/graph/GraphViewLoader";
import NoteTable from "@/components/graph/NoteTable";
import { COSMIC_BG } from "@/components/shared/Starfield";

type GraphNode = {
  id: string;
  title: string | null;
  content: string | null;
  color: string;
  isStub: boolean;
};
type GraphLink = { source: string; target: string; kind: string };
type TableNote = {
  id: string;
  title: string | null;
  content: string | null;
  category: { name: string; color: string } | null;
  createdAt: string;
  isStub: boolean;
};

export default function GraphSection({
  graphNodes,
  graphLinks,
  tableNotes,
  highlightId,
}: {
  graphNodes: GraphNode[];
  graphLinks: GraphLink[];
  tableNotes: TableNote[];
  highlightId?: string;
}) {
  const [view, setView] = useState<"graph" | "table">("graph");

  return (
    <div style={{ background: COSMIC_BG }}>
      <div className="flex justify-center gap-1 border-b border-white/10 py-2">
        {(
          [
            ["graph", "그래프"],
            ["table", "표"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setView(key)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              view === key
                ? "bg-white/15 text-[#FFFBEA]"
                : "text-[#FFFBEA]/50 hover:text-[#FFFBEA]/80"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "graph" ? (
        <GraphView nodes={graphNodes} links={graphLinks} highlightId={highlightId} />
      ) : (
        <NoteTable notes={tableNotes} />
      )}
    </div>
  );
}
