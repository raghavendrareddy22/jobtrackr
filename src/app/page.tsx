import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { prisma } from "@/lib/db";
import { STAGES } from "@/lib/stages";

export const dynamic = "force-dynamic";

const DAY = 86400000;

export default async function Dashboard() {
  const jobs = await prisma.job.findMany({ orderBy: { updatedAt: "desc" } });
  const now = Date.now();
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const resume = await prisma.resume.findFirst({ where: { isMaster: true } });
  const hasApiKey = !!settings?.openrouterKey;
  const hasResume = !!resume;
  const hasJobs = jobs.length > 0;
  const setupDone = hasApiKey && hasResume && hasJobs;
  const setupSteps = [
    {
      done: hasApiKey,
      num: 1,
      title: "Add your OpenRouter API key",
      desc: "Powers AI features: cover letters, resume tailoring, interview prep.",
      href: "/settings",
      cta: "Go to Settings →",
    },
    {
      done: hasResume,
      num: 2,
      title: "Upload your master resume",
      desc: "Upload a PDF or DOCX once — JobTrackr tailors it for every job.",
      href: "/resume",
      cta: "Upload Resume →",
    },
    {
      done: hasJobs,
      num: 3,
      title: "Add your first job",
      desc: "Search live listings or paste a job URL to start tracking.",
      href: "/search",
      cta: "Find Jobs →",
    },
  ];

  const counts = Object.fromEntries(STAGES.map((s) => [s.id, jobs.filter((j) => j.stage === s.id).length]));
  const total = jobs.length;
  const active = jobs.filter((j) => j.stage !== "rejected").length;
  const responded = jobs.filter((j) => ["interviewing", "offer"].includes(j.stage)).length;
  const respRate = total ? Math.round((responded / total) * 100) : 0;

  const nudges = jobs
    .filter((j) => j.stage === "applied" && j.appliedAt && now - new Date(j.appliedAt).getTime() > 7 * DAY)
    .map((j) => ({ ...j, days: Math.floor((now - new Date(j.appliedAt!).getTime()) / DAY) }))
    .sort((a, b) => b.days - a.days);

  const reminders = jobs.filter((j) => j.followUpAt && new Date(j.followUpAt).getTime() <= now + DAY);

  const recent = jobs.slice(0, 5);
  const maxCount = Math.max(1, ...Object.values(counts));

  const stats = [
    { k: "Total applications", v: total },
    { k: "Still active", v: active },
    { k: "Response rate", v: `${respRate}%` },
    { k: "Needs follow-up", v: nudges.length },
  ];

  return (
    <div>
      <TopNav active="/" />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div style={{ marginBottom: 24 }}>
          <div className="eyebrow" style={{ color: "var(--ink-subtle)" }}>Your pipeline</div>
          <h1 className="display-md" style={{ marginTop: 6 }}>Where things stand</h1>
        </div>

        {!setupDone && (
          <div className="panel" style={{ marginBottom: 28, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--hairline)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div className="eyebrow" style={{ color: "var(--primary)", marginBottom: 2 }}>Getting started</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>
                  {setupSteps.filter(s => s.done).length} of 3 steps complete
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {setupSteps.map(s => (
                  <div key={s.num} style={{ width: 32, height: 4, borderRadius: 4, background: s.done ? "var(--success)" : "var(--surface-3)" }} />
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
              {setupSteps.map((s, i) => (
                <div key={s.num} style={{ padding: "20px 24px", borderRight: i < 2 ? "1px solid var(--hairline)" : "none", opacity: s.done ? 0.5 : 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{
                      width: 24, height: 24, borderRadius: "50%",
                      background: s.done ? "var(--success)" : "var(--primary)",
                      color: "#fff", fontSize: 12, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      {s.done ? "✓" : s.num}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{s.title}</span>
                  </div>
                  <p className="body-sm" style={{ color: "var(--ink-muted)", marginBottom: 14, lineHeight: 1.5 }}>{s.desc}</p>
                  {!s.done && (
                    <Link href={s.href} style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>{s.cta}</Link>
                  )}
                  {s.done && <span style={{ fontSize: 12, color: "var(--success)", fontWeight: 600 }}>✓ Done</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {total === 0 ? (
          <div className="panel" style={{ padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>👋</div>
            <div className="card-title" style={{ marginBottom: 8 }}>Welcome to JobTrackr</div>
            <p className="body" style={{ color: "var(--ink-muted)", marginBottom: 8, maxWidth: 380, margin: "0 auto 24px" }}>
              Complete the setup above, then search live job listings or add a job manually to start tracking your applications.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Link href="/search" className="btn-primary">🔍 Find jobs</Link>
              <Link href="/job/new" className="btn-secondary">Add manually</Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
              {STAGES.map((s) => (
                <div key={s.id} className="card" style={{ padding: 16, position: "relative", overflow: "hidden" }}>
                  <div className="display-md" style={{ fontSize: 32, color: s.id === "offer" ? "var(--success)" : "var(--ink)" }}>
                    {counts[s.id]}
                  </div>
                  <div className="caption" style={{ color: "var(--ink-subtle)", marginTop: 6 }}>{s.label}</div>
                  <div style={{ position: "absolute", left: 0, bottom: 0, height: 3, width: `${(counts[s.id] / maxCount) * 100}%`, background: s.id === "offer" ? "var(--success)" : "var(--primary)" }} />
                </div>
              ))}
            </div>

            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              {stats.map((s) => (
                <div key={s.k} className="card" style={{ padding: 20 }}>
                  <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.5 }}>{s.v}</div>
                  <div className="caption" style={{ color: "var(--ink-subtle)", marginTop: 4 }}>{s.k}</div>
                </div>
              ))}
            </div>

            {reminders.length > 0 && (
              <div className="panel" style={{ borderLeft: "2px solid var(--primary)" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--hairline)" }}>
                  <span className="card-title" style={{ fontSize: 16 }}>📅 Follow-up reminders</span>
                </div>
                {reminders.map((j) => (
                  <Link key={j.id} href={`/job/${j.id}`} className="flex items-center justify-between" style={{ padding: "14px 20px", borderBottom: "1px solid var(--hairline-tertiary)" }}>
                    <div>
                      <div className="body-sm" style={{ color: "var(--ink)" }}>{j.title}</div>
                      <div className="caption" style={{ color: "var(--ink-subtle)" }}>{j.company}</div>
                    </div>
                    <span className="caption" style={{ background: "color-mix(in oklab,var(--surface-2),var(--primary) 15%)", color: "var(--primary-hover)", borderRadius: 9999, padding: "3px 10px", whiteSpace: "nowrap" }}>
                      {new Date(j.followUpAt!).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            <div className="grid gap-6" style={{ gridTemplateColumns: "1.3fr 1fr" }}>
              <div className="panel">
                <div className="flex items-center gap-2" style={{ padding: 20, borderBottom: "1px solid var(--hairline)" }}>
                  <span className="card-title" style={{ fontSize: 16 }}>Time to follow up</span>
                </div>
                {nudges.length === 0 ? (
                  <div className="body-sm" style={{ color: "var(--ink-subtle)", padding: 20 }}>
                    Nothing&apos;s gone stale — every application is recent or already moving.
                  </div>
                ) : (
                  nudges.slice(0, 5).map((j) => (
                    <Link key={j.id} href={`/job/${j.id}`} className="flex items-center justify-between" style={{ padding: "14px 20px", borderBottom: "1px solid var(--hairline-tertiary)" }}>
                      <div style={{ minWidth: 0 }}>
                        <div className="body-sm" style={{ color: "var(--ink)" }}>{j.title}</div>
                        <div className="caption" style={{ color: "var(--ink-subtle)" }}>{j.company}</div>
                      </div>
                      <span className="caption" style={{ background: "color-mix(in oklab, var(--surface-2), #c9621f 18%)", color: "#ffb86b", borderRadius: 9999, padding: "3px 10px", whiteSpace: "nowrap" }}>
                        {j.days}d quiet
                      </span>
                    </Link>
                  ))
                )}
              </div>

              <div className="panel">
                <div className="flex items-center gap-2" style={{ padding: 20, borderBottom: "1px solid var(--hairline)" }}>
                  <span className="card-title" style={{ fontSize: 16 }}>Latest movement</span>
                </div>
                {recent.map((j) => (
                  <Link key={j.id} href={`/job/${j.id}`} className="flex items-center justify-between" style={{ padding: "14px 20px", borderBottom: "1px solid var(--hairline-tertiary)" }}>
                    <div style={{ minWidth: 0 }}>
                      <div className="body-sm" style={{ color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.title}</div>
                      <div className="caption" style={{ color: "var(--ink-subtle)" }}>{j.company}</div>
                    </div>
                    <span className="caption" style={{ background: "var(--surface-2)", color: "var(--ink-muted)", borderRadius: 9999, padding: "3px 10px", whiteSpace: "nowrap" }}>
                      {STAGES.find((s) => s.id === j.stage)?.label ?? j.stage}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
