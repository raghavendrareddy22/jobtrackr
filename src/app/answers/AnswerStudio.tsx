"use client";

import { useState } from "react";

const COMMON_Q = [
  "Tell me about yourself.",
  "Why do you want to work here?",
  "Describe a challenge you overcame.",
  "What's your greatest strength?",
  "Why are you leaving your current role?",
  "Where do you see yourself in 5 years?",
];

export function AnswerStudio({ hasResume }: { hasResume: boolean }) {
  const [question, setQuestion] = useState("");
  const [jobContext, setJobContext] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function run() {
    if (!question.trim()) return;
    setBusy(true);
    setError(null);
    setAnswer("");
    try {
      const res = await fetch("/api/answer", { method: "POST", body: JSON.stringify({ question, jobContext }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setAnswer(data.answer);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 1.2fr", alignItems: "start" }}>
      <div className="panel flex flex-col gap-4" style={{ padding: 24, position: "sticky", top: 76 }}>
        <label>
          <span className="caption" style={{ color: "var(--ink-subtle)", display: "block", marginBottom: 4 }}>Question</span>
          <textarea
            className="input"
            rows={3}
            placeholder="Paste an application or interview question…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </label>

        <div>
          <span className="caption" style={{ color: "var(--ink-subtle)", display: "block", marginBottom: 8 }}>Quick picks</span>
          <div className="flex flex-wrap gap-2">
            {COMMON_Q.map((q) => (
              <button
                key={q}
                onClick={() => setQuestion(q)}
                className="caption"
                style={{ background: "var(--surface-2)", color: "var(--ink-muted)", border: "1px solid var(--hairline)", borderRadius: 9999, padding: "4px 10px" }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <label>
          <span className="caption" style={{ color: "var(--ink-subtle)", display: "block", marginBottom: 4 }}>
            Role context <span style={{ color: "var(--ink-tertiary)" }}>(optional)</span>
          </span>
          <textarea
            className="input"
            rows={4}
            placeholder="Paste the job description to make the answer role-specific…"
            value={jobContext}
            onChange={(e) => setJobContext(e.target.value)}
          />
        </label>

        <button className="btn-primary" onClick={run} disabled={busy || !question.trim() || !hasResume}>
          {busy ? "Drafting…" : "Draft my answer"}
        </button>
        {error && <div className="caption" style={{ color: "#ff7676" }}>{error}</div>}
      </div>

      <div>
        {answer ? (
          <div className="panel">
            <div className="flex items-center justify-between" style={{ padding: 20, borderBottom: "1px solid var(--hairline)" }}>
              <span className="card-title" style={{ fontSize: 16 }}>Draft answer</span>
              <button
                className="btn-secondary"
                onClick={async () => {
                  await navigator.clipboard.writeText(answer);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
            <div className="body" style={{ padding: 20, whiteSpace: "pre-wrap", color: "var(--ink-muted)", lineHeight: 1.7 }}>
              {answer}
            </div>
          </div>
        ) : (
          <div className="panel" style={{ padding: 48, textAlign: "center" }}>
            <p className="body-sm" style={{ color: "var(--ink-subtle)", maxWidth: 320, margin: "0 auto" }}>
              Pick a question and you&apos;ll get a first-person draft grounded in your experience — edit it to make it yours.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
