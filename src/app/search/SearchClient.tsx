"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Found = { id: string; title: string; company: string; source: string };
type Status = "pending" | "tailoring" | "done" | "error";

const SOURCES = [
  { id: "adzuna",   label: "Adzuna",   note: "needs API key" },
  { id: "remotive", label: "Remotive", note: "free · remote" },
  { id: "jobicy",   label: "Jobicy",   note: "free · remote" },
];

const SOURCE_COLOR: Record<string, string> = {
  adzuna:   "var(--primary)",
  remotive: "#27a6a4",
  jobicy:   "#a084dc",
};

export function SearchClient({ ready, aiReady }: { ready: boolean; aiReady: boolean }) {
  const router = useRouter();
  const [what, setWhat] = useState("");
  const [where, setWhere] = useState("");
  const [count, setCount] = useState(10);
  const [sources, setSources] = useState<string[]>(["adzuna", "remotive", "jobicy"]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<(Found & { status: Status; score?: number })[]>([]);
  const [phase, setPhase] = useState<"idle" | "tailoring" | "complete">("idle");
  const stopRef = useRef(false);

  function toggleSource(id: string) {
    setSources((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((s) => s !== id) : prev) : [...prev, id]
    );
  }

  const activeSources = sources.filter((s) => s !== "adzuna" || ready);

  async function runSearch() {
    if (!what.trim() || !activeSources.length) return;
    setSearching(true);
    setError(null);
    setJobs([]);
    setPhase("idle");
    stopRef.current = false;
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        body: JSON.stringify({ what, where, count, sources: activeSources }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      if (!data.created.length) {
        setError(data.found ? "Found listings but they're all already on your board." : "No jobs found. Try a broader keyword.");
        setSearching(false);
        return;
      }
      const initial = data.created.map((j: Found) => ({ ...j, status: "pending" as Status }));
      setJobs(initial);
      setSearching(false);
      if (aiReady) await tailorAll(initial);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSearching(false);
    }
  }

  async function tailorAll(list: (Found & { status: Status; score?: number })[]) {
    setPhase("tailoring");
    for (let i = 0; i < list.length; i++) {
      if (stopRef.current) break;
      setJobs((prev) => prev.map((j, k) => (k === i ? { ...j, status: "tailoring" } : j)));
      try {
        const res = await fetch(`/api/kit/${list[i].id}`, { method: "POST" });
        const kit = await res.json();
        if (!res.ok) throw new Error(kit.error || "failed");
        setJobs((prev) => prev.map((j, k) => (k === i ? { ...j, status: "done", score: kit.atsScore } : j)));
      } catch {
        setJobs((prev) => prev.map((j, k) => (k === i ? { ...j, status: "error" } : j)));
      }
    }
    setPhase("complete");
    router.refresh();
  }

  const doneCount = jobs.filter((j) => j.status === "done" || j.status === "error").length;

  return (
    <div className="flex flex-col gap-5">
      <div className="panel" style={{ padding: 24 }}>
        <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
          <label>
            <span className="caption" style={{ color: "var(--ink-subtle)", display: "block", marginBottom: 4 }}>Role / keyword</span>
            <input className="input" placeholder="data analyst" value={what} onChange={(e) => setWhat(e.target.value)} />
          </label>
          <label>
            <span className="caption" style={{ color: "var(--ink-subtle)", display: "block", marginBottom: 4 }}>Location (optional)</span>
            <input className="input" placeholder="Hyderabad" value={where} onChange={(e) => setWhere(e.target.value)} />
          </label>
        </div>

        <div style={{ marginBottom: 16 }}>
          <span className="caption" style={{ color: "var(--ink-subtle)", display: "block", marginBottom: 8 }}>Job boards</span>
          <div className="flex gap-2 flex-wrap">
            {SOURCES.map((s) => {
              const disabled = s.id === "adzuna" && !ready;
              const active = sources.includes(s.id) && !disabled;
              return (
                <button
                  key={s.id}
                  onClick={() => !disabled && toggleSource(s.id)}
                  className="caption"
                  style={{
                    padding: "5px 12px", borderRadius: 9999,
                    background: active ? "color-mix(in oklab,var(--surface-2)," + SOURCE_COLOR[s.id] + " 25%)" : "var(--surface-1)",
                    color: active ? SOURCE_COLOR[s.id] : "var(--ink-tertiary)",
                    border: "1px solid " + (active ? SOURCE_COLOR[s.id] : "var(--hairline)"),
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.45 : 1,
                  }}
                >
                  {s.label}
                  <span style={{ marginLeft: 5, opacity: 0.7 }}>· {disabled ? "no key" : s.note}</span>
                </button>
              );
            })}
          </div>
          {!ready && (
            <div className="caption" style={{ color: "var(--ink-tertiary)", marginTop: 6 }}>
              Adzuna needs an API key in Settings. Remotive and Jobicy are free with no key.
            </div>
          )}
        </div>

        <div className="flex items-end justify-between">
          <label>
            <span className="caption" style={{ color: "var(--ink-subtle)", display: "block", marginBottom: 4 }}>How many per board</span>
            <select className="input" style={{ width: 110, appearance: "none" }} value={count} onChange={(e) => setCount(Number(e.target.value))}>
              {[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button className="btn-primary" onClick={runSearch} disabled={searching || phase === "tailoring" || !activeSources.length}>
            {searching ? "Searching…" : `Search ${activeSources.length} board${activeSources.length !== 1 ? "s" : ""}`}
          </button>
        </div>

        {!aiReady && (
          <div className="caption" style={{ color: "var(--ink-tertiary)", marginTop: 12 }}>
            No OpenRouter key — jobs added but not tailored. Add key in Settings.
          </div>
        )}
        {error && <div className="caption" style={{ color: "#ff7676", marginTop: 12 }}>{error}</div>}
      </div>

      {jobs.length > 0 && (
        <div className="panel" style={{ padding: 24 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <div className="eyebrow" style={{ color: "var(--ink-subtle)" }}>
              {phase === "complete" ? `Done · ${jobs.length} jobs added` : `Tailoring ${doneCount}/${jobs.length}`}
            </div>
            {phase === "tailoring" && (
              <button className="btn-secondary" onClick={() => (stopRef.current = true)}>Stop</button>
            )}
            {phase === "complete" && (
              <button className="btn-primary" onClick={() => router.push("/board")}>View board</button>
            )}
          </div>

          {phase !== "idle" && (
            <div style={{ height: 4, background: "var(--surface-2)", borderRadius: 9999, marginBottom: 16, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(doneCount / jobs.length) * 100}%`, background: "var(--primary)", transition: "width .3s" }} />
            </div>
          )}

          <div className="flex flex-col gap-2">
            {jobs.map((j) => (
              <div key={j.id} className="card flex items-center justify-between" style={{ padding: "12px 16px" }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="body-sm" style={{ color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.title}</div>
                  <div className="caption" style={{ color: "var(--ink-subtle)" }}>
                    {j.company}
                    <span style={{ marginLeft: 8, color: SOURCE_COLOR[j.source] ?? "var(--ink-tertiary)", fontWeight: 500 }}>
                      · {j.source}
                    </span>
                  </div>
                </div>
                <StatusPill status={j.status} score={j.score} jobId={j.id} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status, score, jobId }: { status: Status; score?: number; jobId: string }) {
  if (status === "done") {
    const color = (score ?? 0) >= 75 ? "var(--success)" : "var(--ink-muted)";
    return (
      <a href={`/job/${jobId}`} className="caption" style={{ background: "var(--surface-2)", color, borderRadius: 9999, padding: "3px 12px", whiteSpace: "nowrap" }}>
        {score ?? "–"} match →
      </a>
    );
  }
  const label = status === "tailoring" ? "tailoring…" : status === "error" ? "failed" : "queued";
  const color = status === "error" ? "#ff7676" : "var(--ink-subtle)";
  return <span className="caption" style={{ color, whiteSpace: "nowrap" }}>{label}</span>;
}
