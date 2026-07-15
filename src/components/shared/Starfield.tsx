"use client";

import { useEffect, useState } from "react";

type Star = { x: number; y: number; size: number; opacity: number };
type Nebula = { x: number; y: number; size: number; color: string; opacity: number };

const NEBULA_COLORS = ["#5b4a8a", "#7a4a63", "#3f5f6b", "#6a5a3f"];

export default function Starfield({ count = 180 }: { count?: number }) {
  // Random star/nebula layout only needs to be generated once per mount, not
  // recomputed on every render — a lazy useState initializer (unlike useMemo)
  // is explicitly allowed to be impure for this one-time setup.
  const [stars] = useState<Star[]>(() =>
    Array.from({ length: count }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.8 + 0.4,
      opacity: Math.random() * 0.7 + 0.15,
    })),
  );

  const [nebulae] = useState<Nebula[]>(() =>
    Array.from({ length: 4 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 30 + 30,
      color: NEBULA_COLORS[i % NEBULA_COLORS.length],
      opacity: Math.random() * 0.12 + 0.08,
    })),
  );

  // Render only after mount so the random positions never differ between the
  // server-rendered HTML and the client (which would be a hydration mismatch).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <div className="pointer-events-none absolute inset-0 overflow-hidden" />;
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {nebulae.map((n, i) => (
        <div
          key={`n-${i}`}
          style={{
            position: "absolute",
            left: `${n.x}%`,
            top: `${n.y}%`,
            width: `${n.size}%`,
            height: `${n.size}%`,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${n.color} 0%, transparent 70%)`,
            opacity: n.opacity,
            filter: "blur(6px)",
          }}
        />
      ))}
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
  );
}

export const COSMIC_BG =
  "linear-gradient(180deg, #0d0c1a 0%, #171225 50%, #1f1620 100%)";
