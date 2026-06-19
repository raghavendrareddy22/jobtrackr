import { AppShell } from "@/components/AppShell";
import Link from "next/link";

const STEPS = [
  {
    num: 1,
    title: "Download the extension",
    desc: "The extension folder is inside your JobTrackr project. Download or locate it on your computer.",
    detail: "Path: jobtrackr/extension/ (the folder containing manifest.json, popup.html, content.js)",
  },
  {
    num: 2,
    title: "Open Chrome Extensions",
    desc: 'In Google Chrome, go to chrome://extensions or click the puzzle icon → "Manage Extensions".',
    detail: 'Make sure "Developer mode" toggle (top-right) is turned ON.',
  },
  {
    num: 3,
    title: 'Click "Load unpacked"',
    desc: "Click the Load unpacked button and select the extension/ folder from your JobTrackr project.",
    detail: "Select the folder itself (not any file inside it). Chrome will install the extension instantly.",
  },
  {
    num: 4,
    title: "Pin it to your toolbar",
    desc: 'Click the puzzle icon in Chrome → find "JobTrackr Auto-Apply" → click the pin icon.',
    detail: "The JobTrackr icon will now appear in your toolbar for quick access.",
  },
  {
    num: 5,
    title: "Use it on any job application",
    desc: "Navigate to a job application form (LinkedIn, Indeed, Naukri, Workday, etc.) and click the JobTrackr icon.",
    detail: 'Your resume data loads automatically. Click "Auto-fill form" to fill all fields in one click.',
  },
];

const PLATFORMS = [
  { name: "LinkedIn Easy Apply", icon: "💼", support: "Full" },
  { name: "Indeed Apply", icon: "🔵", support: "Full" },
  { name: "Naukri.com", icon: "🟠", support: "Full" },
  { name: "Workday", icon: "🟢", support: "Full" },
  { name: "Greenhouse", icon: "🌱", support: "Full" },
  { name: "Lever", icon: "⚙️", support: "Full" },
  { name: "Any other site", icon: "🌐", support: "Generic" },
];

export default function ExtensionGuidePage() {
  return (
    <AppShell active="/extension-guide">
      <main className="max-w-3xl mx-auto px-6 py-10">
        <div style={{ marginBottom: 32 }}>
          <div className="eyebrow" style={{ color: "var(--primary)", marginBottom: 6 }}>Chrome Extension</div>
          <h1 className="display-md" style={{ marginBottom: 8 }}>Auto-fill job applications</h1>
          <p className="body" style={{ color: "var(--ink-muted)" }}>
            Install the JobTrackr Chrome extension to automatically fill your name, email, phone, cover letter,
            and work experience into any job application form — with one click.
          </p>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-4" style={{ marginBottom: 40 }}>
          {STEPS.map((s) => (
            <div key={s.num} className="panel" style={{ padding: 24, display: "flex", gap: 20 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", background: "var(--primary)",
                color: "#fff", fontWeight: 700, fontSize: 15,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {s.num}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{s.title}</div>
                <div className="body-sm" style={{ color: "var(--ink-muted)", marginBottom: 6 }}>{s.desc}</div>
                <div className="caption" style={{ color: "var(--ink-subtle)", background: "var(--surface-2)", padding: "6px 10px", borderRadius: 6, display: "inline-block" }}>
                  💡 {s.detail}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Supported platforms */}
        <div className="panel" style={{ padding: 28, marginBottom: 32 }}>
          <div className="eyebrow" style={{ color: "var(--ink-subtle)", marginBottom: 16 }}>Supported platforms</div>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            {PLATFORMS.map((p) => (
              <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--surface-2)", borderRadius: 8 }}>
                <span style={{ fontSize: 20 }}>{p.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: p.support === "Full" ? "var(--success)" : "var(--ink-muted)" }}>
                    {p.support === "Full" ? "✓ Full support" : "✓ Generic fill"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What gets filled */}
        <div className="panel" style={{ padding: 28, marginBottom: 32 }}>
          <div className="eyebrow" style={{ color: "var(--ink-subtle)", marginBottom: 16 }}>What gets auto-filled</div>
          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            {[
              "First & last name", "Email address", "Phone number", "City / Location",
              "Current job title", "Current company", "Professional summary", "Skills list",
              "Education (school, degree, year)", "Cover letter", "Years of experience", "Graduation year",
            ].map((f) => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-muted)" }}>
                <span style={{ color: "var(--success)", fontWeight: 700 }}>✓</span> {f}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/resume" className="btn-primary">Check your resume →</Link>
          <Link href="/board" className="btn-secondary">View board</Link>
        </div>
      </main>
    </AppShell>
  );
}
