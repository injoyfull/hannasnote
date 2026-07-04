"use client";

import { useMemo } from "react";

type Star = { x: number; y: number; size: number; opacity: number };

export default function Starfield({ count = 180 }: { count?: number }) {
  const stars = useMemo<Star[]>(
    () =>
      Array.from({ length: count }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 1.8 + 0.4,
        opacity: Math.random() * 0.7 + 0.15,
      })),
    [count],
  );

  return (
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
  );
}

export const COSMIC_BG =
  "linear-gradient(180deg, #0b1330 0%, #171247 55%, #241a3d 100%)";
