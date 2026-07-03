"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "캡쳐" },
  { href: "/board", label: "보드" },
  { href: "/graph", label: "그래프" },
  { href: "/search", label: "검색" },
  { href: "/categories", label: "카테고리" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-3 border-b border-black/10 bg-[#FFFBEA]/80 px-4 py-2 backdrop-blur">
      <Link
        href="/"
        className="font-heading mr-2 text-lg font-bold text-[#3A3226]"
      >
        HANNAsNote
      </Link>
      <div className="flex gap-1">
        {LINKS.map((link) => {
          const active =
            link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-[#4A6FA5] text-white"
                  : "text-[#3A3226] hover:bg-black/5"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
