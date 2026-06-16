import Link from "next/link";
import { SignOut } from "./SignOut";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/board", label: "Board" },
  { href: "/search", label: "Find jobs" },
  { href: "/answers", label: "Answers" },
  { href: "/simulate", label: "Simulate" },
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
        <Link href="/" className="flex items-center gap-2">
          <span
            className="inline-block"
            style={{ width: 18, height: 18, borderRadius: 4, background: "var(--primary)" }}
          />
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.2 }}>JobTrackr</span>
        </Link>
        <div className="flex items-center gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="body-sm"
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                color: active === l.href ? "var(--ink)" : "var(--ink-subtle)",
                background: active === l.href ? "var(--surface-2)" : "transparent",
                fontWeight: 500,
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/resume" className="btn-secondary">Resume</Link>
        <Link href="/settings" className="btn-secondary">Settings</Link>
        <SignOut />
      </div>
    </nav>
  );
}
