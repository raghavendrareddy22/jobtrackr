import { AppShell } from "@/components/AppShell";
import { NewJobForm } from "./NewJobForm";
import Link from "next/link";

export default function NewJobPage() {
  return (
    <AppShell active="/board">
      <main className="max-w-3xl mx-auto px-6 py-10">
        <Link href="/" className="caption" style={{ color: "var(--ink-subtle)" }}>← Back to pipeline</Link>
        <h1 className="display-md" style={{ marginTop: 8, marginBottom: 6 }}>Add a job</h1>
        <p className="body" style={{ color: "var(--ink-muted)", marginBottom: 32 }}>
          Paste a job URL and we&apos;ll fetch the details, or paste the listing text directly.
        </p>
        <NewJobForm />
      </main>
    </AppShell>
  );
}
