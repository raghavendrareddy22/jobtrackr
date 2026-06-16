import Link from "next/link";
import { SignOut } from "./SignOut";

const LINKS = [
  { href: "/", label: "Dashboard", icon: "⬛", tip: "Your pipeline overview" },
  { href: "/board", label: "Board", icon: "📋", tip: "Kanban view of all jobs" },
  { href: "/search", label: "Find Jobs", icon: "🔍", tip: "Search live listings" },
  { href: "/resume", label: "Resume", icon: "📄", tip: "Your master resume" },
  { href: "/answers", label: "Answers", icon: "💬", tip: "Practice Q&A" },
  { href: "/simulate", label: "Simulate", icon: "🎯", tip: "Mock interview" },
];

export function TopNav({ active }: { active?: string }) {
  return (
    <nav
      className="sticky top-0 z-30 flex items-center justify-between px-6"
      style={{
        height: 56,
        background: "var(--canvas)",
        borderBottom: "1px solid var(--hairline)",
      }}
    >
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2" title="Go to dashboard">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
            <rect width="20" height="20" rx="5" fill="var(--primary)" />
            <path d="M5 10h10M10 5v10" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3 }}>JobTrackr</span>
        </Link>
        <div className="flex items-center gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="body-sm"
              title={l.tip}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                color: active === l.href ? "var(--ink)" : "var(--ink-subtle)",
                background: active === l.href ? "var(--surface-2)" : "transparent",
                fontWeight: active === l.href ? 600 : 500,
                transition: "background .12s, color .12s",
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/settings"
          title="API keys & settings"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 500,
            color: "var(--ink-subtle)", border: "1px solid var(--hairline)",
            background: active === "/settings" ? "var(--surface-2)" : "transparent",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a5 5 0 110 10A5 5 0 018 3zm0 2a3 3 0 100 6 3 3 0 000-6z" fill="currentColor" fillRule="evenodd" />
          </svg>
          Settings
        </Link>
        <SignOut />
      </div>
    </nav>
  );
}
