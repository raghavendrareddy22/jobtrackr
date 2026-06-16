import { TopNav } from "@/components/TopNav";
import { prisma } from "@/lib/db";
import { SearchClient } from "./SearchClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const s = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const resume = await prisma.resume.findFirst({ where: { isMaster: true } });
  const ready = !!(s?.adzunaAppId && s?.adzunaAppKey);
  const aiReady = !!s?.openrouterKey;

  return (
    <div>
      <TopNav active="/search" />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginBottom: 6 }}>Find Jobs</h1>
          <p style={{ fontSize: 14, color: "var(--ink-muted)" }}>
            Search live listings from 4 job boards.{" "}
            {!resume && <Link href="/resume" style={{ color: "var(--primary)" }}>Upload your resume</Link>}
            {resume && !aiReady && <Link href="/settings" style={{ color: "var(--primary)" }}>Add an OpenRouter key</Link>}
            {resume && !aiReady && " to enable AI tailoring."}
          </p>
        </div>
        <SearchClient ready={ready} aiReady={aiReady} />
      </main>
    </div>
  );
}
