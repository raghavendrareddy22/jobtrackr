import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { prisma } from "@/lib/db";
import { STAGES } from "@/lib/stages";

export const dynamic = "force-dynamic";

const DAY = 86400000;

export default async function Dashboard() {
  const jobs = await prisma.job.findMany({ orderBy: { updatedAt: "desc" } });
  const now = Date.now();

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

        {total === 0 ? (
          <div className="panel" style={{ padding: 48, textAlign: "center" }}>
            <div className="card-title" style={{ marginBottom: 8 }}>No jobs yet</div>
            <p className="body" style={{ color: "var(--ink-muted)", marginBottom: 20 }}>
              Search live listings or add one by hand to start tracking.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Link href="/search" className="btn-primary">Find jobs</Link>
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
