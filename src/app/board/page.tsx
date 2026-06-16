import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Board } from "@/components/Board";
import { prisma } from "@/lib/db";
import { STAGES } from "@/lib/stages";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const jobs = await prisma.job.findMany({ orderBy: { createdAt: "desc" } });
  const total = jobs.length;
  const active = jobs.filter((j) => j.stage !== "rejected").length;
  const interviews = jobs.filter((j) => j.stage === "interviewing" || j.stage === "offer").length;

  return (
    <div>
      <TopNav active="/board" />
      <main className="pt-6">

        {/* Header */}
        <div className="px-6 pb-5 flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4 }}>My Board</h1>
            {total > 0 && (
              <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
                <Stat label="Total" value={total} />
                <Stat label="Active" value={active} />
                <Stat label="Interviews" value={interviews} highlight={interviews > 0} />
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/search" className="btn-primary" style={{ fontSize: 13 }}>+ Find Jobs</Link>
            <Link href="/job/new" className="btn-secondary" style={{ fontSize: 13 }}>Add manually</Link>
          </div>
        </div>

        {total === 0 ? (
          <div style={{ maxWidth: 480, margin: "60px auto", textAlign: "center", padding: "0 24px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Your board is empty</h2>
            <p style={{ fontSize: 14, color: "var(--ink-muted)", marginBottom: 24, lineHeight: 1.6 }}>
              Search live job listings or add a job manually to start tracking your applications.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Link href="/search" className="btn-primary">🔍 Find jobs</Link>
              <Link href="/job/new" className="btn-secondary">Add manually</Link>
            </div>
          </div>
        ) : (
          <Board
            initialJobs={jobs.map((j) => ({
              id: j.id,
              title: j.title,
              company: j.company,
              location: j.location,
              stage: j.stage,
              appliedAt: j.appliedAt?.toISOString() ?? null,
              score: j.score,
              matchScore: j.matchScore,
            }))}
          />
        )}
      </main>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
      <span style={{ fontWeight: 700, fontSize: 15, color: highlight ? "var(--success)" : "var(--ink)" }}>{value}</span>
      <span style={{ fontSize: 12, color: "var(--ink-subtle)" }}>{label}</span>
    </div>
  );
}
