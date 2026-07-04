"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ForceGraph2D, {
  type ForceGraphMethods,
  type NodeObject,
} from "react-force-graph-2d";

type GraphNode = {
  id: string;
  title: string | null;
  content: string | null;
  color: string;
  isStub: boolean;
};
type GraphLink = { source: string; target: string; kind: string };

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const n = parseInt(clean, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function shade(hex: string, percent: number) {
  const { r, g, b } = hexToRgb(hex);
  const t = percent < 0 ? 0 : 255;
  const p = Math.abs(percent);
  const mix = (c: number) => Math.round((t - c) * p) + c;
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

type Star = { x: number; y: number; size: number; opacity: number };

export default function GraphView({
  nodes,
  links,
  highlightId,
}: {
  nodes: GraphNode[];
  links: GraphLink[];
  highlightId?: string;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<ForceGraphMethods<NodeObject<GraphNode>> | undefined>(undefined);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [hasCentered, setHasCentered] = useState(false);

  const stars = useMemo<Star[]>(
    () =>
      Array.from({ length: 180 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 1.8 + 0.4,
        opacity: Math.random() * 0.7 + 0.15,
      })),
    [],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function updateSize() {
      if (!el) return;
      setSize({
        width: el.clientWidth,
        height: Math.max(500, window.innerHeight - 140),
      });
    }
    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    window.addEventListener("resize", updateSize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0b1330 0%, #171247 55%, #241a3d 100%)",
      }}
    >
      <div className="pointer-events-none absolute inset-0">
        {stars.map((s, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              borderRadius: "50%",
              background: "white",
              opacity: s.opacity,
              boxShadow: s.size > 1.5 ? "0 0 4px rgba(255,255,255,0.8)" : undefined,
            }}
          />
        ))}
      </div>

      <ForceGraph2D
        ref={fgRef}
        width={size.width}
        height={size.height}
        graphData={{ nodes, links }}
        nodeId="id"
        nodeLabel={(n) =>
          (n as GraphNode).title || (n as GraphNode).content?.slice(0, 40) || ""
        }
        nodeRelSize={5}
        linkColor={() => "rgba(168, 197, 232, 0.55)"}
        linkWidth={1}
        linkCurvature={0.2}
        linkDirectionalParticles={1}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.004}
        linkDirectionalParticleColor={() => "#A8C5E8"}
        linkDirectionalArrowLength={3}
        linkDirectionalArrowRelPos={1}
        backgroundColor="rgba(0,0,0,0)"
        onEngineStop={() => {
          if (hasCentered || !highlightId || !fgRef.current) return;
          const target = nodes.find((n) => n.id === highlightId) as
            | (NodeObject<GraphNode> & { x?: number; y?: number })
            | undefined;
          if (target && typeof target.x === "number" && typeof target.y === "number") {
            fgRef.current.centerAt(target.x, target.y, 900);
            fgRef.current.zoom(3.2, 900);
          }
          setHasCentered(true);
        }}
        onNodeClick={(n) => router.push(`/note/${(n as NodeObject<GraphNode>).id}`)}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const n = node as GraphNode & { x?: number; y?: number };
          const x = n.x ?? 0;
          const y = n.y ?? 0;
          const label = n.title || n.content?.slice(0, 20) || "";
          const fontSize = 11 / globalScale;
          const isHighlighted = n.id === highlightId;
          const radius = isHighlighted ? 7 : 5;

          if (isHighlighted) {
            const pulse = 3 + Math.sin(Date.now() / 250) * 2;
            ctx.beginPath();
            ctx.arc(x, y, radius + 4 + pulse, 0, 2 * Math.PI);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }

          const gradient = ctx.createRadialGradient(
            x - radius * 0.35,
            y - radius * 0.35,
            radius * 0.1,
            x,
            y,
            radius,
          );
          gradient.addColorStop(0, shade(n.color, 0.55));
          gradient.addColorStop(1, shade(n.color, -0.25));

          ctx.save();
          ctx.shadowColor = n.color;
          ctx.shadowBlur = isHighlighted ? 16 : 8;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          if (n.isStub) {
            ctx.globalAlpha = 0.45;
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.setLineDash([2, 2]);
            ctx.strokeStyle = n.color;
            ctx.stroke();
            ctx.setLineDash([]);
          } else {
            ctx.fillStyle = gradient;
            ctx.fill();
          }
          ctx.restore();

          ctx.font = `${fontSize}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillStyle = "rgba(255, 251, 234, 0.9)";
          ctx.fillText(label, x, y + radius + 2);
        }}
      />
    </div>
  );
}
