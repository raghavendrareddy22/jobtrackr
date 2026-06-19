import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/db";
import { deserializeKit } from "@/lib/kit";
import { JobDetailClient } from "./JobDetailClient";

export const dynamic = "force-dynamic";

export default async function JobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const job = await prisma.job.findUnique({ where: { id: jobId }, include: { kit: true } });
  if (!job) notFound();
  const resume = await prisma.resume.findFirst({ where: { isMaster: true } });
  const kit = job.kit ? deserializeKit(job.kit) : null;

  return (
    <AppShell active="/board">
      <main className="max-w-6xl mx-auto px-6 py-10">
        <Link href="/board" className="caption" style={{ color: "var(--ink-subtle)" }}>← Board</Link>
        <JobDetailClient
          job={{
            id: job.id,
            title: job.title,
            company: job.company,
            location: job.location ?? "",
            stage: job.stage,
            notes: job.notes ?? "",
            appliedAt: job.appliedAt?.toISOString() ?? null,
            description: job.description,
            url: job.url ?? null,
            matchScore: job.matchScore,
            followUpAt: job.followUpAt?.toISOString() ?? null,
          }}
          initialKit={kit}
          hasResume={!!resume}
        />
      </main>
    </AppShell>
  );
}
