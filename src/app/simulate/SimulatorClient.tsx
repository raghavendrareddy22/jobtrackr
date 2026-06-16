"use client";

import { useState, useRef, useEffect } from "react";

type Job = { id: string; title: string; company: string };
type Message = { role: "assistant" | "user"; content: string };
type ScoreResult = {
  overall: number;
  grade: string;
  summary: string;
  answers: { question: string; score: number; feedback: string }[];
  strengths: string[];
  improvements: string[];
};

export function SimulatorClient({ jobs }: { jobs: Job[] }) {
  const [jobId, setJobId] = useState(jobs[0]?.id ?? "");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"idle" | "interview" | "scoring" | "done">("idle");
  const [turnCount, setTurnCount] = useState(0);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function startInterview() {
    setMessages([]);
    setScore(null);
    setTurnCount(0);
    setPhase("interview");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        body: JSON.stringify({ jobId: jobId || null, messages: [], phase: "question" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages([{ role: "assistant", content: data.question }]);
      setTurnCount(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setPhase("idle");
    } finally {
      setBusy(false);
    }
  }

  async function sendAnswer() {
    if (!input.trim() || busy) return;
    const answer = input.trim();
    setInput("");
    const next: Message[] = [...messages, { role: "user", content: answer }];
    setMessages(next);
    setBusy(true);

    if (turnCount >= 5) {
      setPhase("scoring");
      try {
        const res = await fetch("/api/simulate", {
          method: "POST",
          body: JSON.stringify({ jobId: jobId || null, messages: next, phase: "score" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setScore(data);
        setPhase("done");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
        setPhase("interview");
      } finally {
        setBusy(false);
      }
      return;
    }

    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        body: JSON.stringify({ jobId: jobId || null, messages: next, phase: "question" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.done) {
        setPhase("scoring");
        const scoreRes = await fetch("/api/simulate", {
          method: "POST",
          body: JSON.stringify({ jobId: jobId || null, messages: next, phase: "score" }),
        });
        const scoreData = await scoreRes.json();
        setScore(scoreData);
        setPhase("done");
      } else {
        setMessages([...next, { role: "assistant", content: data.question }]);
        setTurnCount(data.turnCount);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const gradeColor = (g: string) =>
    g === "A" ? "var(--success)" : g === "B" ? "#27a6a4" : g === "C" ? "#ffb86b" : "#ff7676";

  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: phase === "done" ? "1fr 1.2fr" : "1fr 1.6fr", alignItems: "start" }}>
      <div className="panel" style={{ padding: 24 }}>
        <div className="eyebrow" style={{ color: "var(--ink-subtle)", marginBottom: 12 }}>Session setup</div>

        <label className="block" style={{ marginBottom: 16 }}>
          <span className="caption" style={{ color: "var(--ink-subtle)", display: "block", marginBottom: 4 }}>Job to practise for</span>
          <select
            className="input"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            disabled={phase !== "idle"}
            style={{ fontSize: 14 }}
          >
            <option value="">General interview (no specific job)</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title} — {j.company}</option>
            ))}
          </select>
        </label>

        <div className="body-sm" style={{ color: "var(--ink-muted)", marginBottom: 20, lineHeight: 1.6 }}>
          The AI will ask 5 interview questions one at a time, then score your answers on clarity, relevance, and depth.
        </div>

        <button
          className="btn-primary"
          style={{ width: "100%" }}
          onClick={phase === "idle" || phase === "done" ? startInterview : undefined}
          disabled={busy || phase === "interview" || phase === "scoring"}
        >
          {phase === "idle" ? "Start mock interview" : phase === "done" ? "Start over" : phase === "scoring" ? "Scoring…" : `Question ${turnCount} of 5`}
        </button>

        {error && <div className="caption" style={{ color: "#ff7676", marginTop: 12 }}>{error}</div>}

        {phase === "interview" && (
          <div style={{ marginTop: 20 }}>
            <div className="caption" style={{ color: "var(--ink-subtle)", marginBottom: 8 }}>Progress</div>
            <div style={{ display: "flex", gap: 4 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 4, borderRadius: 9999,
                  background: i < turnCount ? "var(--primary)" : "var(--surface-3)",
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {phase === "idle" && (
          <div className="panel" style={{ padding: 48, textAlign: "center" }}>
            <div className="card-title" style={{ marginBottom: 8, fontSize: 18 }}>Ready when you are</div>
            <p className="body-sm" style={{ color: "var(--ink-muted)", maxWidth: 320, margin: "0 auto" }}>
              Pick a job from your pipeline on the left, then hit Start. The AI interviewer will ask 5 questions and score your performance.
            </p>
          </div>
        )}

        {(phase === "interview" || phase === "scoring") && messages.length > 0 && (
          <div className="panel" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxHeight: 520, overflowY: "auto" }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: m.role === "assistant" ? "flex-start" : "flex-end",
              }}>
                <div style={{
                  maxWidth: "82%",
                  padding: "10px 14px",
                  borderRadius: m.role === "assistant" ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
                  background: m.role === "assistant" ? "var(--surface-2)" : "var(--primary)",
                  color: "var(--ink)",
                  fontSize: 14,
                  lineHeight: 1.6,
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {busy && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ padding: "10px 14px", background: "var(--surface-2)", borderRadius: "4px 16px 16px 16px", fontSize: 14, color: "var(--ink-subtle)" }}>
                  Thinking…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {phase === "interview" && (
          <div className="flex gap-2">
            <textarea
              className="input"
              rows={3}
              placeholder="Type your answer… (Enter to send, Shift+Enter for new line)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAnswer(); }
              }}
              disabled={busy}
              style={{ flex: 1, fontSize: 14, resize: "none" }}
            />
            <button className="btn-primary" onClick={sendAnswer} disabled={busy || !input.trim()} style={{ alignSelf: "flex-end", whiteSpace: "nowrap" }}>
              Send
            </button>
          </div>
        )}

        {phase === "done" && score && (
          <div className="flex flex-col gap-4">
            <div className="card" style={{ padding: 24, display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ textAlign: "center", minWidth: 80 }}>
                <div style={{ fontSize: 48, fontWeight: 600, color: gradeColor(score.grade), lineHeight: 1 }}>{score.grade}</div>
                <div className="caption" style={{ color: "var(--ink-subtle)", marginTop: 4 }}>{score.overall}/100</div>
              </div>
              <div>
                <div className="body-sm" style={{ color: "var(--ink-muted)", lineHeight: 1.7 }}>{score.summary}</div>
              </div>
            </div>

            <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="panel" style={{ padding: 20 }}>
                <div className="eyebrow" style={{ color: "var(--success)", marginBottom: 10 }}>Strengths</div>
                {score.strengths.map((s, i) => (
                  <div key={i} className="body-sm" style={{ color: "var(--ink-muted)", marginBottom: 6, paddingLeft: 12, borderLeft: "2px solid var(--success)" }}>{s}</div>
                ))}
              </div>
              <div className="panel" style={{ padding: 20 }}>
                <div className="eyebrow" style={{ color: "#ffb86b", marginBottom: 10 }}>To improve</div>
                {score.improvements.map((s, i) => (
                  <div key={i} className="body-sm" style={{ color: "var(--ink-muted)", marginBottom: 6, paddingLeft: 12, borderLeft: "2px solid #ffb86b" }}>{s}</div>
                ))}
              </div>
            </div>

            <div className="panel" style={{ padding: 20 }}>
              <div className="eyebrow" style={{ color: "var(--ink-subtle)", marginBottom: 14 }}>Answer breakdown</div>
              <div className="flex flex-col gap-4">
                {score.answers.map((a, i) => (
                  <div key={i} style={{ paddingBottom: 14, borderBottom: "1px solid var(--hairline-tertiary)" }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                      <div className="body-sm" style={{ color: "var(--ink)", fontWeight: 500 }}>Q{i + 1}: {a.question}</div>
                      <span className="caption" style={{
                        borderRadius: 9999, padding: "2px 10px", flexShrink: 0, marginLeft: 8,
                        background: a.score >= 75 ? "color-mix(in oklab,var(--surface-2),var(--success) 20%)" : a.score >= 50 ? "color-mix(in oklab,var(--surface-2),#c9621f 12%)" : "var(--surface-2)",
                        color: a.score >= 75 ? "var(--success)" : a.score >= 50 ? "#ffb86b" : "var(--ink-subtle)",
                      }}>{a.score}</span>
                    </div>
                    <div className="caption" style={{ color: "var(--ink-muted)" }}>{a.feedback}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
