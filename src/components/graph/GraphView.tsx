"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ForceGraph2D, { type NodeObject } from "react-force-graph-2d";

type GraphNode = {
  id: string;
  title: string | null;
  content: string | null;
  color: string;
  isStub: boolean;
};
type GraphLink = { source: string; target: string; kind: string };

export default function GraphView({
  nodes,
  links,
}: {
  nodes: GraphNode[];
  links: GraphLink[];
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    function updateSize() {
      if (!containerRef.current) return;
      setSize({
        width: containerRef.current.clientWidth,
        height: Math.max(500, window.innerHeight - 140),
      });
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      <ForceGraph2D
        width={size.width}
        height={size.height}
        graphData={{ nodes, links }}
        nodeId="id"
        nodeLabel={(n) => (n as GraphNode).title || (n as GraphNode).content?.slice(0, 40) || ""}
        nodeColor={(n) => (n as GraphNode).color}
        nodeRelSize={5}
        linkColor={() => "#4A6FA5"}
        linkWidth={1.2}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        backgroundColor="#FFF3B0"
        onNodeClick={(n) => router.push(`/note/${(n as NodeObject<GraphNode>).id}`)}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const n = node as GraphNode & { x?: number; y?: number };
          const label = n.title || n.content?.slice(0, 20) || "";
          const fontSize = 11 / globalScale;
          const radius = 5;

          ctx.beginPath();
          ctx.arc(n.x ?? 0, n.y ?? 0, radius, 0, 2 * Math.PI);
          ctx.fillStyle = n.color;
          if (n.isStub) {
            ctx.globalAlpha = 0.4;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = n.color;
            ctx.setLineDash([2, 2]);
            ctx.stroke();
            ctx.setLineDash([]);
          } else {
            ctx.fill();
          }

          ctx.font = `${fontSize}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillStyle = "#3A3226";
          ctx.fillText(label, n.x ?? 0, (n.y ?? 0) + radius + 2);
        }}
      />
    </div>
  );
}
