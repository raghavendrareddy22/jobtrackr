import Link from "next/link";
import { SignOut } from "./SignOut";

const LINKS = [
  { href: "/board", label: "Board", icon: (c: string) => (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
      <rect x="2.5" y="3.5" width="5" height="13" rx="1.5" stroke={c} strokeWidth="1.6"/>
      <rect x="9.5" y="3.5" width="5" height="8" rx="1.5" stroke={c} strokeWidth="1.6"/>
      <rect x="9.5" y="3.5" width="5" height="8" rx="1.5" stroke={c} strokeWidth="1.6" opacity="0"/>
      <rect x="14.8" y="3.5" width="2.7" height="5" rx="1.3" stroke={c} strokeWidth="1.6"/>
    </svg>
  )},
  { href: "/search", label: "Find Jobs", icon: (c: string) => (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
      <circle cx="8.5" cy="8.5" r="5.5" stroke={c} strokeWidth="1.6"/>
      <path d="M16.5 16.5l-3.8-3.8" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  )},
  { href: "/resume", label: "Resume", icon: (c: string) => (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
      <path d="M5 2.5h7l3.5 3.5V17a.5.5 0 01-.5.5H5a.5.5 0 01-.5-.5V3a.5.5 0 01.5-.5z" stroke={c} strokeWidth="1.6"/>
      <path d="M7 10h6M7 13h6" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )},
];

export function AppShell({ active, children }: { active?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 232, flexShrink: 0, height: "100vh", position: "sticky", top: 0,
          background: "var(--surface-1)", borderRight: "1px solid var(--hairline)",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Logo */}
        <Link href="/board" style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 20px 16px", textDecoration: "none" }}>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" style={{ flexShrink: 0 }}>
            <rect width="26" height="26" rx="7" fill="#5e6ad2" />
            <path d="M7 13h12M13 7v12" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.4, color: "var(--ink)" }}>JobTrackr</span>
        </Link>

        {/* Nav links */}
        <nav style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          {LINKS.map((l) => {
            const isActive = active === l.href;
            const color = isActive ? "#5e6ad2" : "var(--ink-subtle)";
            return (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 8,
                  fontSize: 14, fontWeight: isActive ? 600 : 500,
                  color: isActive ? "var(--ink)" : "var(--ink-muted)",
                  background: isActive ? "#5e6ad214" : "transparent",
                  textDecoration: "none",
                  transition: "background .12s, color .12s",
                }}
              >
                {l.icon(color)}
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: settings + sign out */}
        <div style={{ padding: 12, borderTop: "1px solid var(--hairline)", display: "flex", flexDirection: "column", gap: 4 }}>
          <Link
            href="/settings"
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 8, fontSize: 14, fontWeight: active === "/settings" ? 600 : 500,
              color: active === "/settings" ? "var(--ink)" : "var(--ink-muted)",
              background: active === "/settings" ? "var(--surface-2)" : "transparent",
              textDecoration: "none",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.7"/>
              <path d="M10 2v2.2M10 15.8V18M3 10h2.2M14.8 10H17M5 5l1.5 1.5M13.5 13.5L15 15M5 15l1.5-1.5M13.5 6.5L15 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Settings
          </Link>
          <div style={{ padding: "2px 4px" }}>
            <SignOut />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
}
