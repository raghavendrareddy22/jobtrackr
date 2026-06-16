"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Found = { id: string; title: string; company: string; location?: string; source: string };
type Status = "pending" | "tailoring" | "done" | "error";

const SOURCES = [
  { id: "adzuna",   label: "Adzuna",   note: "needs API key" },
  { id: "remotive", label: "Remotive", note: "free · remote" },
  { id: "jobicy",   label: "Jobicy",   note: "free · remote" },
];

const SOURCE_COLOR: Record<string, string> = {
  adzuna:   "#5e6ad2",
  remotive: "#27a6a4",
  jobicy:   "#a084dc",
};

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const letter = name?.[0]?.toUpperCase() ?? "?";
  const colors = ["#5e6ad2","#27a6a4","#a084dc","#e86c3a","#2eaadc","#27a644"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: 10, background: color + "20",
      border: `1.5px solid ${color}40`, display: "flex", alignItems: "center",
      justifyContent: "center", flexShrink: 0, color, fontWeight: 700,
      fontSize: size * 0.4,
    }}>
      {letter}
    </div>
  );
}

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
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24, alignItems: "start" }}>
      {/* Sidebar filters */}
      <aside style={{ position: "sticky", top: 72 }}>
        <div className="panel" style={{ padding: 20 }}>
          <div className="eyebrow" style={{ color: "var(--ink-subtle)", marginBottom: 14 }}>Filters</div>

          <div style={{ marginBottom: 20 }}>
            <div className="caption" style={{ color: "var(--ink-muted)", fontWeight: 600, marginBottom: 8 }}>Job boards</div>
            <div className="flex flex-col gap-2">
              {SOURCES.map((s) => {
                const disabled = s.id === "adzuna" && !ready;
                const active = sources.includes(s.id) && !disabled;
                return (
                  <button
                    key={s.id}
                    onClick={() => !disabled && toggleSource(s.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 10px", borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer",
                      background: active ? SOURCE_COLOR[s.id] + "15" : "transparent",
                      border: "1px solid " + (active ? SOURCE_COLOR[s.id] + "60" : "var(--hairline)"),
                      opacity: disabled ? 0.45 : 1, textAlign: "left", width: "100%",
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: active ? SOURCE_COLOR[s.id] : "var(--hairline-strong)", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: active ? SOURCE_COLOR[s.id] : "var(--ink-muted)" }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>{disabled ? "needs API key" : s.note}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            {!ready && (
              <Link href="/settings" style={{ display: "block", fontSize: 11, color: "var(--primary)", marginTop: 8, textDecoration: "underline" }}>
                Add Adzuna key →
              </Link>
            )}
          </div>

          <div style={{ marginBottom: 20 }}>
            <div className="caption" style={{ color: "var(--ink-muted)", fontWeight: 600, marginBottom: 8 }}>Results per search</div>
            <select
              className="input"
              style={{ appearance: "none", fontSize: 13, padding: "6px 10px" }}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            >
              {[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n} jobs</option>)}
            </select>
          </div>

          {!aiReady && (
            <div style={{ padding: "10px 12px", borderRadius: 8, background: "color-mix(in oklab,var(--surface-2),#c9621f 10%)", fontSize: 12, color: "#c9621f", lineHeight: 1.4 }}>
              Add an OpenRouter key in <Link href="/settings" style={{ textDecoration: "underline" }}>Settings</Link> to enable AI tailoring.
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col gap-4">
        {/* Search bar */}
        <div className="panel" style={{ padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "flex-end" }}>
            <label>
              <span className="caption" style={{ color: "var(--ink-subtle)", display: "block", marginBottom: 6, fontWeight: 500 }}>Job title or keyword</span>
              <input
                className="input"
                placeholder="e.g. Data Analyst, Frontend Developer"
                value={what}
                onChange={(e) => setWhat(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
              />
            </label>
            <label>
              <span className="caption" style={{ color: "var(--ink-subtle)", display: "block", marginBottom: 6, fontWeight: 500 }}>Location</span>
              <input
                className="input"
                placeholder="e.g. Hyderabad, Remote"
                value={where}
                onChange={(e) => setWhere(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
              />
            </label>
            <button
              className="btn-primary"
              onClick={runSearch}
              disabled={searching || phase === "tailoring" || !activeSources.length || !what.trim()}
              style={{ height: 40, paddingLeft: 20, paddingRight: 20, fontWeight: 600 }}
            >
              {searching ? "Searching…" : "Search"}
            </button>
          </div>
          {error && <div className="caption" style={{ color: "#e05c5c", marginTop: 12, padding: "8px 12px", background: "#ff7676" + "15", borderRadius: 8 }}>⚠ {error}</div>}
        </div>

        {/* Results */}
        {jobs.length > 0 && (
          <div className="flex flex-col gap-0">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                {phase === "complete" ? `${jobs.length} jobs added to your board` : phase === "tailoring" ? `AI tailoring ${doneCount} of ${jobs.length}…` : `${jobs.length} jobs found`}
              </div>
              <div className="flex gap-2">
                {phase === "tailoring" && (
                  <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => (stopRef.current = true)}>Stop</button>
                )}
                {phase === "complete" && (
                  <Link href="/board" className="btn-primary" style={{ fontSize: 13 }}>View board →</Link>
                )}
              </div>
            </div>

            {phase !== "idle" && (
              <div style={{ height: 3, background: "var(--surface-3)", borderRadius: 9999, marginBottom: 16, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(doneCount / jobs.length) * 100}%`, background: "var(--primary)", transition: "width .3s" }} />
              </div>
            )}

            <div className="flex flex-col gap-3">
              {jobs.map((j) => (
                <JobResultCard key={j.id} job={j} />
              ))}
            </div>
          </div>
        )}

        {jobs.length === 0 && !searching && !error && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>Search for jobs above</div>
            <div className="body-sm" style={{ color: "var(--ink-muted)" }}>
              Type a role (e.g. &ldquo;Software Engineer&rdquo;) and optionally a location
            </div>
          </div>
        )}

        {searching && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>Searching live listings…</div>
            <div className="caption" style={{ color: "var(--ink-muted)" }}>This may take a few seconds</div>
          </div>
        )}
      </div>
    </div>
  );
}

function JobResultCard({ job }: { job: Found & { status: Status; score?: number } }) {
  const scoreColor = (score: number) =>
    score >= 75 ? "#16a34a" : score >= 50 ? "#d97706" : "var(--ink-muted)";
  const scoreBg = (score: number) =>
    score >= 75 ? "#16a34a20" : score >= 50 ? "#d9770620" : "var(--surface-2)";

  return (
    <div
      className="panel"
      style={{
        padding: "18px 20px",
        display: "flex", alignItems: "center", gap: 16,
        transition: "box-shadow .15s, border-color .15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(94,105,210,0.1)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--hairline)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      <Avatar name={job.company} size={44} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", lineHeight: 1.3 }}>{job.title}</div>
        </div>
        <div style={{ fontSize: 13, color: "var(--ink-muted)", marginBottom: 6 }}>
          {job.company}{job.location ? ` · ${job.location}` : ""}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 9999,
            background: SOURCE_COLOR[job.source] + "15",
            color: SOURCE_COLOR[job.source] ?? "var(--ink-muted)",
            border: `1px solid ${SOURCE_COLOR[job.source] ?? "var(--hairline)"}40`,
          }}>
            {job.source}
          </span>
          {job.status === "tailoring" && (
            <span style={{ fontSize: 11, color: "var(--primary)", fontWeight: 500 }}>✦ AI tailoring…</span>
          )}
          {job.status === "pending" && (
            <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>queued</span>
          )}
          {job.status === "error" && (
            <span style={{ fontSize: 11, color: "#e05c5c" }}>tailoring failed</span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {job.status === "done" && job.score != null && (
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize: 15, fontWeight: 700, color: scoreColor(job.score),
              background: scoreBg(job.score), borderRadius: 8,
              padding: "4px 10px", lineHeight: 1.3,
            }}>
              {job.score}%
            </div>
            <div style={{ fontSize: 10, color: "var(--ink-tertiary)", marginTop: 2 }}>match</div>
          </div>
        )}
        <Link
          href={`/job/${job.id}`}
          style={{
            fontSize: 13, fontWeight: 600, color: "var(--primary)",
            background: "var(--primary)" + "12", border: "1px solid var(--primary)" + "40",
            padding: "7px 14px", borderRadius: 8, whiteSpace: "nowrap",
            textDecoration: "none", display: "inline-block",
          }}
        >
          View →
        </Link>
      </div>
    </div>
  );
}
