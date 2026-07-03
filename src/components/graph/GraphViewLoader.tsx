"use client";

import dynamic from "next/dynamic";

const GraphView = dynamic(() => import("@/components/graph/GraphView"), {
  ssr: false,
  loading: () => (
    <p className="p-8 text-sm text-[#3A3226]/60">그래프를 그리는 중...</p>
  ),
});

export default GraphView;
