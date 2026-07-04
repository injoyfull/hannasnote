"use client";

import dynamic from "next/dynamic";

const Canvas = dynamic(() => import("@/components/board/Canvas"), {
  ssr: false,
  loading: () => (
    <p className="p-8 text-sm text-[#FFFBEA]/60">보드를 그리는 중...</p>
  ),
});

export default Canvas;
