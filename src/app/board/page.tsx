import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { Board } from "@/components/Board";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const jobs = await prisma.job.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <TopNav active="/board" />
      <main className="pt-6">
        <div className="px-6 pb-4 flex items-end justify-between">
          <div>
            <h1 className="display-md">Pipeline</h1>
            <p className="body-sm" style={{ color: "var(--ink-subtle)", marginTop: 4 }}>
              {jobs.length === 0 ? "No jobs yet — add your first one →" : `${jobs.length} job${jobs.length === 1 ? "" : "s"} tracked · drag cards to move stages`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/search" className="btn-primary">Find jobs</Link>
            <Link href="/job/new" className="btn-secondary">Add manually</Link>
          </div>
        </div>
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
      </main>
    </div>
  );
}
