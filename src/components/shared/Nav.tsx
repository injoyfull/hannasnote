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
    <nav className="flex gap-1 border-b border-black/10 bg-white/60 px-4 py-2 backdrop-blur">
      {LINKS.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-blue-600 text-white"
                : "text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
