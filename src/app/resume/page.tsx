import { TopNav } from "@/components/TopNav";
import { prisma } from "@/lib/db";
import { ResumeEditor } from "./ResumeEditor";

export const dynamic = "force-dynamic";

export default async function ResumePage() {
  const r = await prisma.resume.findFirst({ where: { isMaster: true } });
  const initial = r
    ? {
        id: r.id,
        name: r.name,
        email: r.email || "",
        phone: r.phone || "",
        location: r.location || "",
        summary: r.summary || "",
        skills: JSON.parse(r.skills || "[]") as string[],
        experience: JSON.parse(r.experience || "[]") as { company: string; title: string; start: string; end: string; bullets: string[] }[],
        education: JSON.parse(r.education || "[]") as { school: string; degree: string; year: string }[],
      }
    : null;

  return (
    <div>
      <TopNav />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="display-md" style={{ marginBottom: 6 }}>Master resume</h1>
        <p className="body" style={{ color: "var(--ink-muted)", marginBottom: 32 }}>
          This is the source of truth. Upload a PDF/DOCX to populate it, then edit anything by hand. Every tailored resume is generated from this.
        </p>
        <ResumeEditor initial={initial} />
      </main>
    </div>
  );
}
