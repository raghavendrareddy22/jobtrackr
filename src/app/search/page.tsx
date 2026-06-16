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
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="display-md" style={{ marginBottom: 6 }}>Find jobs</h1>
        <p className="body" style={{ color: "var(--ink-muted)", marginBottom: 24 }}>
          Type a role and location. JobTrackr searches live listings, adds them to your board, and tailors your resume to each one automatically.
        </p>
        {!ready && (
          <div className="card" style={{ padding: 16, marginBottom: 16, borderLeft: "2px solid #ffb86b" }}>
            <span className="body-sm" style={{ color: "#ffb86b" }}>
              Add your Adzuna App ID & Key in <Link href="/settings" style={{ color: "var(--primary-hover)", textDecoration: "underline" }}>Settings</Link> first.
            </span>
          </div>
        )}
        {ready && !resume && (
          <div className="card" style={{ padding: 16, marginBottom: 16, borderLeft: "2px solid #ffb86b" }}>
            <span className="body-sm" style={{ color: "#ffb86b" }}>
              Upload your <Link href="/resume" style={{ color: "var(--primary-hover)", textDecoration: "underline" }}>master resume</Link> so tailoring works.
            </span>
          </div>
        )}
        <SearchClient ready={ready} aiReady={aiReady} />
      </main>
    </div>
  );
}
