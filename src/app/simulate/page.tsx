import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/db";
import { SimulatorClient } from "./SimulatorClient";

export const dynamic = "force-dynamic";

export default async function SimulatePage() {
  const jobs = await prisma.job.findMany({
    where: { stage: { not: "rejected" } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, company: true },
  });

  return (
    <AppShell active="/simulate">
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="eyebrow" style={{ color: "var(--primary-hover)", marginBottom: 6 }}>AI studio</div>
        <h1 className="display-md">Interview simulator</h1>
        <p className="body" style={{ color: "var(--ink-muted)", marginTop: 6, marginBottom: 28, maxWidth: 560 }}>
          5-round mock interview tailored to any job in your pipeline. Get scored on clarity, depth, and relevance after each session.
        </p>
        <SimulatorClient jobs={jobs} />
      </main>
    </AppShell>
  );
}
