"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/board", label: "Board" },
  { href: "/search", label: "Find jobs" },
  { href: "/answers", label: "Answers" },
  { href: "/resume", label: "Resume" },
];

export function NavLinks() {
  const path = usePathname();
  return (
    <div className="flex items-center gap-1">
      {LINKS.map((l) => {
        const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className="body-sm"
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              color: active ? "var(--ink)" : "var(--ink-subtle)",
              background: active ? "var(--surface-2)" : "transparent",
            }}
          >
            {l.label}
          </Link>
        );
      })}
    </div>
  );
}
