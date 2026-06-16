"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Found = { id: string; title: string; company: string; location?: string; source: string };
type Status = "pending" | "tailoring" | "done" | "error";

const SOURCES = [
  { id: "adzuna",    label: "Adzuna",    note: "needs API key" },
  { id: "remotive",  label: "Remotive",  note: "free · remote" },
  { id: "jobicy",    label: "Jobicy",    note: "free · remote" },
  { id: "arbeitnow", label: "Arbeitnow", note: "free · global" },
];

const SOURCE_COLOR: Record<string, string> = {
  adzuna:    "#5e6ad2",
  remotive:  "#27a6a4",
  jobicy:    "#a084dc",
  arbeitnow: "#e86c3a",
};

function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const letter = name?.[0]?.toUpperCase() ?? "?";
  const colors = ["#5e6ad2","#27a6a4","#a084dc","#e86c3a","#2eaadc","#27a644"];
  const color = colors[(name.charCodeAt(0) ?? 0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: 10, background: color + "18",
      border: `1.5px solid ${color}35`, display: "flex", alignItems: "center",
      justifyContent: "center", flexShrink: 0, color, fontWeight: 700, fontSize: size * 0.38,
    }}>
      {letter}
    </div>
  );
}

export function SearchClient({ ready, aiReady }: { ready: boolean; aiReady: boolean }) {
  const router = useRouter();
  const [what, setWhat] = useState("");
  const [where, setWhere] = useState("");
  const count = 50;
  const [sources, setSources] = useState<string[]>(["adzuna", "remotive", "jobicy", "arbeitnow"]);
  const [last24h, setLast24h] = useState(true);
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
        body: JSON.stringify({ what, where, count, sources: activeSources, last24h }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      if (!data.created.length) {
        setError(data.found ? "All listings already on your board." : "No jobs found. Try a broader keyword or turn off the 24h filter.");
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
    <div style={{ maxWidth: 720, margin: "0 auto" }}>

      {/* Search bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input
          className="input"
          placeholder="Job title or keyword  —  e.g. Product Manager"
          value={what}
          onChange={(e) => setWhat(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch()}
          style={{ flex: 2, fontSize: 15 }}
          autoFocus
        />
        <input
          className="input"
          placeholder="Location (optional)"
          value={where}
          onChange={(e) => setWhere(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch()}
          style={{ flex: 1, fontSize: 15 }}
        />
        <button
          className="btn-primary"
          onClick={runSearch}
          disabled={searching || phase === "tailoring" || !what.trim()}
          style={{ paddingLeft: 24, paddingRight: 24, fontSize: 14, fontWeight: 600, flexShrink: 0 }}
        >
          {searching ? "Searching…" : "Search"}
        </button>
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
        {/* 24h toggle */}
        <button
          onClick={() => setLast24h((v) => !v)}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "4px 12px", borderRadius: 9999, fontSize: 12, fontWeight: 600, cursor: "pointer",
            background: last24h ? "#5e6ad2" : "var(--surface-2)",
            color: last24h ? "#fff" : "var(--ink-muted)",
            border: "1px solid " + (last24h ? "#5e6ad2" : "var(--hairline)"),
            transition: "all .12s",
          }}
        >
          {last24h ? "✓ " : ""}Last 24 hours
        </button>

        <div style={{ width: 1, height: 16, background: "var(--hairline)" }} />

        {/* Source toggles */}
        {SOURCES.map((s) => {
          const disabled = s.id === "adzuna" && !ready;
          const active = sources.includes(s.id) && !disabled;
          return (
            <button
              key={s.id}
              onClick={() => !disabled && toggleSource(s.id)}
              style={{
                padding: "4px 12px", borderRadius: 9999, fontSize: 12, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer",
                background: active ? SOURCE_COLOR[s.id] + "15" : "var(--surface-1)",
                color: active ? SOURCE_COLOR[s.id] : "var(--ink-tertiary)",
                border: "1px solid " + (active ? SOURCE_COLOR[s.id] + "50" : "var(--hairline)"),
                opacity: disabled ? 0.4 : 1,
                transition: "all .12s",
              }}
            >
              {s.label}
            </button>
          );
        })}

        {!ready && (
          <Link href="/settings" style={{ fontSize: 12, color: "var(--primary)", marginLeft: 4 }}>
            + Add Adzuna key
          </Link>
        )}
      </div>

      {/* AI warning */}
      {!aiReady && (
        <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--surface-2)", fontSize: 13, color: "var(--ink-muted)", marginBottom: 20 }}>
          <Link href="/settings" style={{ color: "var(--primary)", fontWeight: 600 }}>Add an OpenRouter key</Link> to enable AI tailoring for each job.
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fee2e2", color: "#b91c1c", fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Loading state */}
      {searching && (
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>Searching {activeSources.length} job boards…</div>
          <div style={{ color: "var(--ink-muted)", fontSize: 13, marginTop: 6 }}>Fetching fresh listings from the last 24 hours</div>
        </div>
      )}

      {/* Results */}
      {jobs.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
              {phase === "complete"
                ? `${jobs.length} jobs added to your board`
                : phase === "tailoring"
                ? `AI tailoring ${doneCount} of ${jobs.length}…`
                : `${jobs.length} jobs found`}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {phase === "tailoring" && (
                <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => (stopRef.current = true)}>Stop</button>
              )}
              {phase === "complete" && (
                <Link href="/board" className="btn-primary" style={{ fontSize: 13, textDecoration: "none" }}>View board →</Link>
              )}
            </div>
          </div>

          {phase !== "idle" && (
            <div style={{ height: 3, background: "var(--surface-3)", borderRadius: 9999, marginBottom: 16, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(doneCount / jobs.length) * 100}%`, background: "var(--primary)", transition: "width .3s" }} />
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {jobs.map((j) => <JobCard key={j.id} job={j} />)}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!searching && !error && jobs.length === 0 && (
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✦</div>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Search for any job role above</div>
          <div style={{ color: "var(--ink-muted)", fontSize: 14 }}>Fresh listings from Adzuna, Remotive, Jobicy & Arbeitnow</div>
        </div>
      )}
    </div>
  );
}

function JobCard({ job }: { job: Found & { status: Status; score?: number } }) {
  const scoreColor = job.score != null
    ? job.score >= 75 ? "#16a34a" : job.score >= 50 ? "#d97706" : "var(--ink-muted)"
    : null;
  const scoreBg = job.score != null
    ? job.score >= 75 ? "#16a34a18" : job.score >= 50 ? "#d9770618" : "var(--surface-2)"
    : null;

  const Avatar = () => {
    const letter = job.company?.[0]?.toUpperCase() ?? "?";
    const colors = ["#5e6ad2","#27a6a4","#a084dc","#e86c3a","#2eaadc","#27a644"];
    const color = colors[(job.company.charCodeAt(0) ?? 0) % colors.length];
    return (
      <div style={{
        width: 44, height: 44, borderRadius: 10, background: color + "18",
        border: `1.5px solid ${color}35`, display: "flex", alignItems: "center",
        justifyContent: "center", flexShrink: 0, color, fontWeight: 700, fontSize: 17,
      }}>
        {letter}
      </div>
    );
  };

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "16px 18px", background: "var(--canvas)",
        border: "1px solid var(--hairline)", borderRadius: 12,
        transition: "border-color .12s, box-shadow .12s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#5e6ad260";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(94,105,210,0.08)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--hairline)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      <Avatar />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)", marginBottom: 3 }}>{job.title}</div>
        <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>
          {job.company}{job.location ? ` · ${job.location}` : ""}
        </div>
        <div style={{ marginTop: 6 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 9999,
            background: (SOURCE_COLOR[job.source] ?? "#888") + "15",
            color: SOURCE_COLOR[job.source] ?? "var(--ink-muted)",
            border: `1px solid ${(SOURCE_COLOR[job.source] ?? "#888")}30`,
          }}>
            {job.source}
          </span>
          {job.status === "tailoring" && (
            <span style={{ fontSize: 11, color: "var(--primary)", fontWeight: 500, marginLeft: 8 }}>✦ tailoring…</span>
          )}
          {job.status === "error" && (
            <span style={{ fontSize: 11, color: "#dc2626", marginLeft: 8 }}>tailoring failed</span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {job.status === "done" && job.score != null && (
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontWeight: 700, fontSize: 14, color: scoreColor!,
              background: scoreBg!, borderRadius: 8, padding: "4px 10px",
            }}>
              {job.score}%
            </div>
            <div style={{ fontSize: 10, color: "var(--ink-tertiary)", marginTop: 1 }}>match</div>
          </div>
        )}
        <Link
          href={`/job/${job.id}`}
          style={{
            fontSize: 13, fontWeight: 600, color: "var(--primary)",
            background: "#5e6ad212", border: "1px solid #5e6ad230",
            padding: "7px 14px", borderRadius: 8, textDecoration: "none",
          }}
        >
          View →
        </Link>
      </div>
    </div>
  );
}
