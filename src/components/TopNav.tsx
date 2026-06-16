import Link from "next/link";
import { SignOut } from "./SignOut";

const LINKS = [
  { href: "/board", label: "Board" },
  { href: "/search", label: "Find Jobs" },
  { href: "/resume", label: "Resume" },
];

export function TopNav({ active }: { active?: string }) {
  return (
    <nav
      className="sticky top-0 z-30 flex items-center justify-between px-6"
      style={{
        height: 52,
        background: "var(--canvas)",
        borderBottom: "1px solid var(--hairline)",
      }}
    >
      <div className="flex items-center gap-8">
        <Link href="/board" className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect width="22" height="22" rx="6" fill="#5e6ad2" />
            <path d="M6 11h10M11 6v10" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.4, color: "var(--ink)" }}>JobTrackr</span>
        </Link>
        <div className="flex items-center gap-1">
          {LINKS.map((l) => {
            const isActive = active === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  padding: "5px 12px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--ink)" : "var(--ink-subtle)",
                  background: isActive ? "var(--surface-2)" : "transparent",
                  textDecoration: "none",
                  transition: "background .1s, color .1s",
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          title="Settings"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 32, height: 32, borderRadius: 8,
            color: active === "/settings" ? "var(--ink)" : "var(--ink-subtle)",
            background: active === "/settings" ? "var(--surface-2)" : "transparent",
            border: "1px solid var(--hairline)",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </Link>
        <SignOut />
      </div>
    </nav>
  );
}
