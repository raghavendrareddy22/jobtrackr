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
      <TopNav />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div style={{ marginBottom: 24 }}>
          <h1 className="display-md" style={{ marginBottom: 6 }}>Find Jobs</h1>
          <p className="body-sm" style={{ color: "var(--ink-muted)" }}>
            Search live listings — JobTrackr adds them to your board and tailors your resume automatically.
            {ready && !resume && (
              <> <Link href="/resume" style={{ color: "var(--primary)", textDecoration: "underline" }}>Upload your resume</Link> to enable AI tailoring.</>
            )}
          </p>
        </div>
        <SearchClient ready={ready} aiReady={aiReady} />
      </main>
    </div>
  );
}
