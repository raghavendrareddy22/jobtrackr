"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Kit } from "@/lib/kit";

type JobProps = {
  id: string;
  title: string;
  company: string;
  location: string;
  stage: string;
  notes: string;
  appliedAt: string | null;
  description: string;
  url: string | null;
  matchScore: number | null;
  followUpAt: string | null;
};

type LogEntry = { id: string; type: string; body: string; createdAt: string };
type ResumeData = { name: string; email: string; phone: string; location: string; summary: string; skills: string; experience: string };

const LOG_TYPES = [
  { id: "email", label: "Email" },
  { id: "call", label: "Call" },
  { id: "note", label: "Note" },
];

export function JobDetailClient({ job, initialKit, hasResume }: { job: JobProps; initialKit: Kit | null; hasResume: boolean }) {
  const router = useRouter();
  const [kit, setKit] = useState<Kit | null>(initialKit);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"gap" | "cover" | "bullets" | "questions" | "company" | "resume">("gap");
  const [matchScore, setMatchScore] = useState<number | null>(job.matchScore);
  const [scoring, setScoring] = useState(false);
  const [salary, setSalary] = useState<{ low: number; mid: number; high: number; currency: string; note: string } | null>(null);
  const [salaryBusy, setSalaryBusy] = useState(false);
  const [smartApplied, setSmartApplied] = useState(false);

  const [editing, setEditing] = useState(false);
  const [head, setHead] = useState({ title: job.title, company: job.company, location: job.location });
  const [notes, setNotes] = useState(job.notes);
  const [notesSaved, setNotesSaved] = useState(false);

  const [followUpAt, setFollowUpAt] = useState(job.followUpAt ? job.followUpAt.slice(0, 10) : "");
  const [followSaved, setFollowSaved] = useState(false);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logType, setLogType] = useState("email");
  const [logBody, setLogBody] = useState("");
  const [logAdding, setLogAdding] = useState(false);

  useEffect(() => {
    fetch(`/api/jobs/${job.id}/activity`).then((r) => r.json()).then(setLogs).catch(() => {});
  }, [job.id]);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/kit/${job.id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setKit(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function saveHead() {
    await fetch(`/api/jobs/${job.id}`, { method: "PATCH", body: JSON.stringify(head) });
    setEditing(false);
    router.refresh();
  }

  async function removeJob() {
    if (!confirm(`Delete "${head.title}" at ${head.company}? This also deletes its generated kit.`)) return;
    await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
    router.push("/");
  }

  async function estimateSalary() {
    setSalaryBusy(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/salary`, { method: "POST" });
      const data = await res.json();
      if (res.ok) setSalary(data);
    } catch { /* silent */ } finally {
      setSalaryBusy(false);
    }
  }

  function smartApply() {
    if (job.url) window.open(job.url, "_blank");
    if (kit?.coverLetter) {
      navigator.clipboard.writeText(kit.coverLetter).catch(() => {});
    }
    setSmartApplied(true);
  }

  async function scoreMatch() {
    if (!hasResume) return;
    setScoring(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/match`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.score != null) setMatchScore(data.score);
    } catch { /* silent */ } finally {
      setScoring(false);
    }
  }

  async function saveNotes() {
    await fetch(`/api/jobs/${job.id}`, { method: "PATCH", body: JSON.stringify({ notes }) });
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  }

  async function saveFollowUp(val: string) {
    setFollowUpAt(val);
    await fetch(`/api/jobs/${job.id}`, { method: "PATCH", body: JSON.stringify({ followUpAt: val || null }) });
    setFollowSaved(true);
    setTimeout(() => setFollowSaved(false), 2000);
  }

  async function addLog() {
    if (!logBody.trim()) return;
    setLogAdding(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/activity`, {
        method: "POST",
        body: JSON.stringify({ type: logType, body: logBody }),
      });
      const entry = await res.json();
      setLogs((prev) => [entry, ...prev]);
      setLogBody("");
    } finally {
      setLogAdding(false);
    }
  }

  async function deleteLog(id: string) {
    await fetch(`/api/jobs/${job.id}/activity`, { method: "DELETE", body: JSON.stringify({ id }) });
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }

  const appliedDays = job.appliedAt ? Math.floor((Date.now() - new Date(job.appliedAt).getTime()) / 86400000) : null;
  const [showQuickApply, setShowQuickApply] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);

  async function openQuickApply() {
    setShowQuickApply(true);
    if (!resumeData) {
      try {
        const r = await fetch("/api/resume/master");
        if (r.ok) setResumeData(await r.json());
      } catch { /* silent */ }
    }
  }

  return (
    <div>
      {showQuickApply && (
        <QuickApplyPanel
          resumeData={resumeData}
          coverLetter={kit?.coverLetter ?? null}
          jobTitle={head.title}
          company={head.company}
          jobUrl={job.url}
          onClose={() => setShowQuickApply(false)}
        />
      )}
      <div className="job-detail-header flex items-start justify-between" style={{ marginTop: 8, marginBottom: 24 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {!editing ? (
            <>
              <h1 className="display-md" style={{ fontSize: "clamp(24px,4vw,40px)" }}>{head.title}</h1>
              <p className="subhead" style={{ color: "var(--ink-muted)", marginTop: 4 }}>
                {head.company}{head.location ? ` · ${head.location}` : ""}
              </p>
            </>
          ) : (
            <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr 1fr", maxWidth: 700 }}>
              <input className="input" value={head.title} onChange={(e) => setHead({ ...head, title: e.target.value })} placeholder="Title" />
              <input className="input" value={head.company} onChange={(e) => setHead({ ...head, company: e.target.value })} placeholder="Company" />
              <input className="input" value={head.location} onChange={(e) => setHead({ ...head, location: e.target.value })} placeholder="Location" />
            </div>
          )}
        </div>
        <div className="job-header-actions flex items-center gap-2" style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
          <span className="caption" style={{ background: "var(--surface-2)", color: "var(--ink-muted)", borderRadius: 9999, padding: "4px 12px" }}>
            {job.stage}
          </span>
          {matchScore != null ? (
            <button
              className="caption"
              onClick={scoreMatch}
              disabled={scoring || !hasResume}
              title="Recalculate match score"
              style={{
                borderRadius: 9999, padding: "4px 12px", border: "none",
                cursor: hasResume ? "pointer" : "default",
                background: matchScore >= 75 ? "color-mix(in oklab,var(--surface-2),var(--success) 20%)" : matchScore >= 50 ? "color-mix(in oklab,var(--surface-2),#c9621f 12%)" : "var(--surface-2)",
                color: matchScore >= 75 ? "var(--success)" : matchScore >= 50 ? "#ffb86b" : "var(--ink-subtle)",
              }}
            >
              {scoring ? "Scoring…" : `${matchScore}% match`}
            </button>
          ) : (
            hasResume && (
              <button className="btn-secondary caption" onClick={scoreMatch} disabled={scoring} style={{ padding: "4px 12px" }}>
                {scoring ? "Scoring…" : "Score fit"}
              </button>
            )
          )}
          {appliedDays !== null && (
            <span className="caption" style={{ background: "var(--surface-1)", color: "var(--ink-subtle)", borderRadius: 9999, padding: "4px 12px", border: "1px solid var(--hairline)" }}>
              applied {appliedDays === 0 ? "today" : `${appliedDays}d ago`}
            </span>
          )}
          <button
            className="btn-secondary"
            onClick={openQuickApply}
            style={{ fontWeight: 600, borderColor: "var(--primary)", color: "var(--primary)" }}
          >
            ⚡ Quick Apply
          </button>
          {job.url && (
            <button
              className="btn-primary"
              onClick={smartApply}
              title={kit?.coverLetter ? "Opens job URL + copies cover letter" : "Opens job URL"}
            >
              {smartApplied ? "Opened ✓" : "Open & Apply"}
            </button>
          )}
          {!editing ? (
            <button className="btn-secondary" onClick={() => setEditing(true)}>Edit</button>
          ) : (
            <button className="btn-primary" onClick={saveHead}>Save</button>
          )}
          <button className="btn-secondary" style={{ color: "#ff7676" }} onClick={removeJob}>Delete</button>
        </div>
      </div>

      <div className="job-detail-grid grid gap-6" style={{ gridTemplateColumns: "1fr 1.4fr" }}>
        <div className="flex flex-col gap-4">
          <div className="panel" style={{ padding: 24 }}>
            <div className="eyebrow" style={{ color: "var(--ink-subtle)", marginBottom: 12 }}>Job description</div>
            <div className="body-sm" style={{ whiteSpace: "pre-wrap", color: "var(--ink-muted)", maxHeight: 300, overflow: "auto" }}>
              {job.description}
            </div>
          </div>

          <div className="panel" style={{ padding: 24 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
              <div className="eyebrow" style={{ color: "var(--ink-subtle)" }}>Notes</div>
              {notesSaved && <span className="caption" style={{ color: "var(--success)" }}>Saved</span>}
            </div>
            <textarea
              className="input"
              rows={4}
              placeholder="Recruiter name, salary mentioned, referral contact…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
            />
          </div>

          <div className="panel" style={{ padding: 24 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
              <div className="eyebrow" style={{ color: "var(--ink-subtle)" }}>Follow-up reminder</div>
              {followSaved && <span className="caption" style={{ color: "var(--success)" }}>Saved</span>}
            </div>
            <input
              type="date"
              className="input"
              value={followUpAt}
              onChange={(e) => saveFollowUp(e.target.value)}
              style={{ colorScheme: "dark" }}
            />
            <div className="caption" style={{ color: "var(--ink-tertiary)", marginTop: 6 }}>
              Shows as a nudge on your dashboard when the date arrives.
            </div>
          </div>

          <div className="panel" style={{ padding: 24 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
              <div className="eyebrow" style={{ color: "var(--ink-subtle)" }}>Salary estimate</div>
              {!salary && (
                <button className="btn-secondary caption" style={{ padding: "4px 12px" }} onClick={estimateSalary} disabled={salaryBusy}>
                  {salaryBusy ? "Estimating…" : "Estimate"}
                </button>
              )}
            </div>
            {salary ? (
              <div>
                <div className="flex items-end gap-3" style={{ marginBottom: 8 }}>
                  <span className="caption" style={{ color: "var(--ink-subtle)" }}>Low</span>
                  <span className="body" style={{ color: "var(--ink-muted)" }}>${salary.low.toLocaleString()}</span>
                  <span style={{ fontSize: 22, fontWeight: 600, color: "var(--success)", letterSpacing: -0.5 }}>${salary.mid.toLocaleString()}</span>
                  <span className="body" style={{ color: "var(--ink-muted)" }}>${salary.high.toLocaleString()}</span>
                  <span className="caption" style={{ color: "var(--ink-subtle)" }}>High</span>
                </div>
                <div className="caption" style={{ color: "var(--ink-tertiary)" }}>{salary.note}</div>
                <button className="caption" style={{ color: "var(--ink-tertiary)", background: "none", border: "none", cursor: "pointer", marginTop: 8, padding: 0 }} onClick={estimateSalary}>
                  {salaryBusy ? "Re-estimating…" : "Recalculate"}
                </button>
              </div>
            ) : (
              <div className="caption" style={{ color: "var(--ink-tertiary)" }}>
                AI-estimated range based on title, company, and location. For reference only.
              </div>
            )}
          </div>

          {smartApplied && (
            <div className="panel" style={{ padding: 24, borderLeft: "2px solid var(--primary)" }}>
              <div className="eyebrow" style={{ color: "var(--primary-hover)", marginBottom: 12 }}>Smart apply checklist</div>
              {[
                kit?.coverLetter ? "Cover letter copied to clipboard ✓" : "Generate a kit first to get your cover letter",
                "Upload your tailored resume (from the Resume tab)",
                "Paste your cover letter into the application",
                "Double-check your contact details",
                "Set a follow-up reminder above",
              ].map((item, i) => (
                <div key={i} className="body-sm" style={{ color: i === 0 && kit?.coverLetter ? "var(--success)" : "var(--ink-muted)", marginBottom: 8, paddingLeft: 12, borderLeft: "1px solid var(--hairline)" }}>
                  {item}
                </div>
              ))}
            </div>
          )}

          <div className="panel" style={{ padding: 24 }}>
            <div className="eyebrow" style={{ color: "var(--ink-subtle)", marginBottom: 14 }}>Activity log</div>
            <div className="flex gap-2" style={{ marginBottom: 10 }}>
              {LOG_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setLogType(t.id)}
                  className="caption"
                  style={{
                    padding: "4px 12px", borderRadius: 9999,
                    background: logType === t.id ? "var(--primary)" : "var(--surface-2)",
                    color: logType === t.id ? "var(--ink)" : "var(--ink-subtle)",
                    border: "none",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="input"
                placeholder={logType === "email" ? "Recruiter emailed — moving to phone screen" : logType === "call" ? "30 min call with hiring manager" : "Add a note…"}
                value={logBody}
                onChange={(e) => setLogBody(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addLog()}
                style={{ flex: 1, fontSize: 14 }}
              />
              <button className="btn-primary" onClick={addLog} disabled={logAdding || !logBody.trim()} style={{ whiteSpace: "nowrap" }}>
                Add
              </button>
            </div>
            {logs.length > 0 && (
              <div className="flex flex-col gap-2" style={{ marginTop: 14 }}>
                {logs.map((l) => (
                  <div key={l.id} className="flex items-start justify-between gap-2" style={{ paddingBottom: 10, borderBottom: "1px solid var(--hairline-tertiary)" }}>
                    <div>
                      <span className="caption" style={{ color: "var(--primary-hover)", marginRight: 8, textTransform: "uppercase", letterSpacing: "0.4px" }}>{l.type}</span>
                      <span className="body-sm" style={{ color: "var(--ink-muted)" }}>{l.body}</span>
                      <div className="caption" style={{ color: "var(--ink-tertiary)", marginTop: 2 }}>
                        {new Date(l.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <button onClick={() => deleteLog(l.id)} className="caption" style={{ color: "var(--ink-tertiary)", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            {logs.length === 0 && (
              <div className="caption" style={{ color: "var(--ink-tertiary)", marginTop: 12 }}>No activity yet — log emails, calls, and notes here.</div>
            )}
          </div>
        </div>

        <div>
          {!kit && (
            <div className="panel flex flex-col items-start gap-4" style={{ padding: 48 }}>
              <div>
                <div className="card-title" style={{ marginBottom: 6 }}>Generate application kit</div>
                <div className="body-sm" style={{ color: "var(--ink-muted)" }}>
                  Tailored cover letter, 4 resume bullets, 5 interview questions, a one-page company brief, gap analysis, and an ATS score — in one shot.
                </div>
              </div>
              {!hasResume && (
                <div className="caption" style={{ color: "#ffb86b" }}>
                  Add your master resume first: <Link href="/resume" style={{ color: "var(--primary-hover)", textDecoration: "underline" }}>Resume setup →</Link>
                </div>
              )}
              <button className="btn-primary" onClick={generate} disabled={loading || !hasResume}>
                {loading ? "Generating…" : "Generate kit"}
              </button>
              {error && <div className="caption" style={{ color: "#ff7676" }}>{error}</div>}
            </div>
          )}

          {kit && (
            <div className="flex flex-col gap-4">
              <div className="card flex items-center justify-between" style={{ padding: 20 }}>
                <div>
                  <div className="eyebrow" style={{ color: "var(--ink-subtle)" }}>ATS Match Score</div>
                  <div className="display-md" style={{ color: kit.atsScore >= 75 ? "var(--success)" : "var(--ink)" }}>{kit.atsScore}</div>
                </div>
                <div className="flex flex-col gap-1" style={{ maxWidth: 320 }}>
                  {kit.atsTips.slice(0, 3).map((tip, i) => (
                    <div key={i} className="caption" style={{ color: "var(--ink-muted)" }}>· {tip}</div>
                  ))}
                </div>
                <button className="btn-secondary" onClick={generate} disabled={loading}>{loading ? "…" : "Regenerate"}</button>
              </div>
              {error && <div className="caption" style={{ color: "#ff7676" }}>{error}</div>}

              <div className="flex gap-2 flex-wrap">
                {([
                  ["gap", "Gap analysis"],
                  ["cover", "Cover letter"],
                  ["bullets", "Resume bullets"],
                  ["questions", "Interview Qs"],
                  ["company", "Company brief"],
                  ["resume", "Tailored resume"],
                ] as const).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    style={{
                      padding: "6px 14px", borderRadius: 9999,
                      background: tab === id ? "var(--surface-2)" : "transparent",
                      color: tab === id ? "var(--ink)" : "var(--ink-subtle)",
                      fontSize: 13, fontWeight: 500,
                      border: "1px solid " + (tab === id ? "var(--hairline-strong)" : "transparent"),
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="panel" style={{ padding: 24 }}>
                {tab === "gap" && <GapAnalysis gap={kit.gapAnalysis} />}
                {tab === "cover" && <CoverLetterEditor jobId={job.id} text={kit.coverLetter} onChange={(t) => setKit({ ...kit, coverLetter: t })} />}
                {tab === "bullets" && (
                  <div>
                    <CopyButton text={kit.resumeBullets.map((b) => `• ${b}`).join("\n")} label="Copy all bullets" />
                    <ul className="flex flex-col gap-3 body" style={{ paddingLeft: 0, listStyle: "none", marginTop: 16 }}>
                      {kit.resumeBullets.map((b, i) => (
                        <li key={i} style={{ paddingLeft: 16, borderLeft: "2px solid var(--primary)" }}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {tab === "questions" && (
                  <ol className="flex flex-col gap-3 body">
                    {kit.interviewQs.map((q, i) => <li key={i}>{i + 1}. {q}</li>)}
                  </ol>
                )}
                {tab === "company" && (
                  <div>
                    <CopyButton text={kit.companyBrief} label="Copy brief" />
                    <div className="body" style={{ whiteSpace: "pre-wrap", marginTop: 16 }}>{kit.companyBrief}</div>
                  </div>
                )}
                {tab === "resume" && (
                  <div>
                    <div className="flex justify-end mb-4">
                      <a className="btn-primary" href={`/api/resume/pdf/${job.id}`} target="_blank">Download PDF</a>
                    </div>
                    <TailoredResumePreview r={kit.tailoredResume} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn-secondary"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}

function CoverLetterEditor({ jobId, text, onChange }: { jobId: string; text: string; onChange: (t: string) => void }) {
  const [saved, setSaved] = useState(false);
  async function save() {
    await fetch(`/api/kit/${jobId}/cover`, { method: "PATCH", body: JSON.stringify({ coverLetter: text }) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }
  return (
    <div>
      <div className="flex items-center gap-2 justify-end" style={{ marginBottom: 12 }}>
        {saved && <span className="caption" style={{ color: "var(--success)" }}>Saved</span>}
        <CopyButton text={text} label="Copy letter" />
      </div>
      <textarea
        className="input"
        rows={18}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        onBlur={save}
        style={{ fontSize: 15, lineHeight: 1.6 }}
      />
      <div className="caption" style={{ color: "var(--ink-tertiary)", marginTop: 6 }}>
        Edit freely — auto-saves when you click away.
      </div>
    </div>
  );
}

function GapAnalysis({ gap }: { gap: Kit["gapAnalysis"] }) {
  if (!gap.matched.length && !gap.missing.length && !gap.verdict) {
    return <div className="body-sm" style={{ color: "var(--ink-subtle)" }}>No gap analysis yet — hit Regenerate to produce one.</div>;
  }
  return (
    <div className="flex flex-col gap-6">
      {gap.verdict && (
        <div className="card" style={{ padding: 16, borderLeft: "2px solid var(--primary)" }}>
          <div className="eyebrow" style={{ color: "var(--ink-subtle)", marginBottom: 6 }}>Verdict</div>
          <div className="body">{gap.verdict}</div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="eyebrow" style={{ color: "var(--success)", marginBottom: 10 }}>Matched · {gap.matched.length}</div>
          <div className="flex flex-wrap gap-2">
            {gap.matched.map((k, i) => (
              <span key={i} className="caption" style={{ background: "var(--surface-2)", color: "var(--ink-muted)", borderRadius: 9999, padding: "3px 10px", border: "1px solid var(--hairline)" }}>{k}</span>
            ))}
          </div>
        </div>
        <div>
          <div className="eyebrow" style={{ color: "#ffb86b", marginBottom: 10 }}>Missing · {gap.missing.length}</div>
          <div className="flex flex-wrap gap-2">
            {gap.missing.map((k, i) => (
              <span key={i} className="caption" style={{ background: "var(--surface-1)", color: "var(--ink-subtle)", borderRadius: 9999, padding: "3px 10px", border: "1px dashed var(--hairline-strong)" }}>{k}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="caption" style={{ color: "var(--ink-tertiary)" }}>Missing keywords are from the job description. Add any you do have to your master resume and regenerate.</div>
    </div>
  );
}

function TailoredResumePreview({ r }: { r: Kit["tailoredResume"] }) {
  return (
    <div style={{ background: "#fff", color: "#111", padding: 40, borderRadius: 8, fontFamily: "Georgia, serif" }}>
      <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 2 }}>{r.name}</div>
      <div style={{ fontSize: 12, color: "#555", marginBottom: 16 }}>{r.contact}</div>
      <Section title="Summary"><p style={{ fontSize: 13 }}>{r.summary}</p></Section>
      <Section title="Skills"><p style={{ fontSize: 13 }}>{r.skills.join(" · ")}</p></Section>
      <Section title="Experience">
        {r.experience.map((e, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <b>{e.title}, {e.company}</b><span>{e.dates}</span>
            </div>
            <ul style={{ fontSize: 13, marginTop: 4, paddingLeft: 18 }}>
              {e.bullets.map((b, j) => <li key={j} style={{ marginBottom: 2 }}>{b}</li>)}
            </ul>
          </div>
        ))}
      </Section>
      <Section title="Education">
        {r.education.map((e, i) => (
          <div key={i} style={{ fontSize: 13 }}><b>{e.school}</b> — {e.degree} ({e.year})</div>
        ))}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid #111", paddingBottom: 2, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function QuickApplyPanel({
  resumeData, coverLetter, jobTitle, company, jobUrl, onClose,
}: {
  resumeData: ResumeData | null;
  coverLetter: string | null;
  jobTitle: string;
  company: string;
  jobUrl: string | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(key: string, text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  const exp = resumeData?.experience ? (() => {
    try { return JSON.parse(resumeData.experience); } catch { return []; }
  })() : [];
  const latest = exp[0] ?? {};
  const skills = resumeData?.skills ? (() => {
    try { return (JSON.parse(resumeData.skills) as string[]).join(", "); } catch { return ""; }
  })() : "";

  const fields = [
    { key: "name",     label: "Full Name",       value: resumeData?.name ?? "" },
    { key: "email",    label: "Email",            value: resumeData?.email ?? "" },
    { key: "phone",    label: "Phone",            value: resumeData?.phone ?? "" },
    { key: "location", label: "Location / City",  value: resumeData?.location ?? "" },
    { key: "title",    label: "Current Job Title", value: latest.title ?? "" },
    { key: "company",  label: "Current Company",  value: latest.company ?? "" },
    { key: "skills",   label: "Skills",           value: skills },
    { key: "summary",  label: "Professional Summary", value: resumeData?.summary ?? "" },
  ];

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        display: "flex", alignItems: "flex-start", justifyContent: "flex-end",
      }}
    >
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} />
      <div
        style={{
          position: "relative", width: 420, height: "100vh", overflowY: "auto",
          background: "var(--canvas)", borderLeft: "1px solid var(--hairline)",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--hairline)", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>⚡ Quick Apply</div>
            <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 3 }}>
              {jobTitle} · {company}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-muted)", fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        {/* Instructions */}
        <div style={{ padding: "12px 24px", background: "color-mix(in oklab,var(--surface-1),var(--primary) 5%)", borderBottom: "1px solid var(--hairline)" }}>
          <div style={{ fontSize: 12, color: "var(--ink-muted)", lineHeight: 1.5 }}>
            Click <strong>Copy</strong> next to each field, then paste it into the application form. Use the Chrome extension below for automatic filling.
          </div>
        </div>

        {/* Open job link */}
        {jobUrl && (
          <div style={{ padding: "12px 24px", borderBottom: "1px solid var(--hairline)" }}>
            <a href={jobUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: "inline-block", fontSize: 13, textDecoration: "none" }}>
              Open Application →
            </a>
          </div>
        )}

        {/* Fields */}
        <div style={{ flex: 1, padding: "16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
          {!resumeData && (
            <div style={{ padding: 16, background: "var(--surface-2)", borderRadius: 8, fontSize: 13, color: "var(--ink-muted)" }}>
              No resume on file. <Link href="/resume" style={{ color: "var(--primary)", textDecoration: "underline" }}>Upload your resume →</Link>
            </div>
          )}
          {fields.map((f) => (
            <div key={f.key} style={{ background: "var(--surface-1)", border: "1px solid var(--hairline)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-subtle)", textTransform: "uppercase", letterSpacing: 0.4 }}>{f.label}</span>
                <button
                  onClick={() => copy(f.key, f.value)}
                  disabled={!f.value}
                  style={{
                    fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, cursor: f.value ? "pointer" : "not-allowed",
                    background: copied === f.key ? "var(--success)" : "var(--primary)",
                    color: "#fff", border: "none", opacity: f.value ? 1 : 0.4,
                    transition: "background .15s",
                  }}
                >
                  {copied === f.key ? "Copied ✓" : "Copy"}
                </button>
              </div>
              <div style={{ fontSize: 13, color: f.value ? "var(--ink)" : "var(--ink-tertiary)", fontStyle: f.value ? "normal" : "italic", lineHeight: 1.4, wordBreak: "break-word" }}>
                {f.value || "Not set — add to your resume"}
              </div>
            </div>
          ))}

          {/* Cover letter */}
          {coverLetter && (
            <div style={{ background: "color-mix(in oklab,var(--surface-1),var(--primary) 5%)", border: "1px solid var(--primary)40", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--primary)", textTransform: "uppercase", letterSpacing: 0.4 }}>Cover Letter</span>
                <button
                  onClick={() => copy("cover", coverLetter)}
                  style={{
                    fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, cursor: "pointer",
                    background: copied === "cover" ? "var(--success)" : "var(--primary)",
                    color: "#fff", border: "none", transition: "background .15s",
                  }}
                >
                  {copied === "cover" ? "Copied ✓" : "Copy"}
                </button>
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-muted)", lineHeight: 1.5, maxHeight: 100, overflow: "hidden", maskImage: "linear-gradient(to bottom, black 60%, transparent)" }}>
                {coverLetter}
              </div>
            </div>
          )}
          {!coverLetter && (
            <div style={{ padding: 14, background: "var(--surface-2)", borderRadius: 10, fontSize: 12, color: "var(--ink-muted)", textAlign: "center" }}>
              Generate a kit to get an AI cover letter for this job
            </div>
          )}
        </div>

        {/* Chrome extension promo */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--hairline)", background: "var(--surface-1)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>🔌 Auto-fill with Chrome extension</div>
          <div style={{ fontSize: 11, color: "var(--ink-muted)", lineHeight: 1.5, marginBottom: 10 }}>
            Install the JobTrackr extension to fill all fields automatically on LinkedIn, Indeed, Naukri and any other job site.
          </div>
          <Link
            href="/extension-guide"
            style={{ fontSize: 12, fontWeight: 600, color: "var(--primary)", textDecoration: "none" }}
          >
            How to install the extension →
          </Link>
        </div>
      </div>
    </div>
  );
}
