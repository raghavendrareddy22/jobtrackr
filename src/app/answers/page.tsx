import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { prisma } from "@/lib/db";
import { AnswerStudio } from "./AnswerStudio";

export const dynamic = "force-dynamic";

export default async function AnswersPage() {
  const resume = await prisma.resume.findFirst({ where: { isMaster: true } });
  return (
    <div>
      <TopNav active="/answers" />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="eyebrow" style={{ color: "var(--primary-hover)", marginBottom: 6 }}>AI studio</div>
        <h1 className="display-md">Answer Studio</h1>
        <p className="body" style={{ color: "var(--ink-muted)", marginTop: 6, marginBottom: 28, maxWidth: 560 }}>
          Draft personalized answers to the questions every application throws at you — built from your own experience, ready to tweak.
        </p>
        {!resume && (
          <div className="card" style={{ padding: 16, marginBottom: 16, borderLeft: "2px solid #ffb86b" }}>
            <span className="body-sm" style={{ color: "#ffb86b" }}>
              Add your <Link href="/resume" style={{ color: "var(--primary-hover)", textDecoration: "underline" }}>master resume</Link> first so answers sound like you.
            </span>
          </div>
        )}
        <AnswerStudio hasResume={!!resume} />
      </main>
    </div>
  );
}
