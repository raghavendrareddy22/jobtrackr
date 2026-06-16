"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewJobForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"url" | "paste" | "linkedin">("url");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ url: "", title: "", company: "", location: "", description: "" });

  async function fetchFromUrl() {
    if (!form.url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/scrape", { method: "POST", body: JSON.stringify({ url: form.url }) });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setForm((f) => ({ ...f, title: data.title, company: data.company, description: data.description, location: data.location ?? "" }));
    } catch (e) {
      setError("Couldn't fetch that URL. Paste the text instead.");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!form.title || !form.company || !form.description) {
      setError("Title, company, and description are required.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/jobs", { method: "POST", body: JSON.stringify(form) });
    const job = await res.json();
    router.push(`/job/${job.id}`);
  }

  return (
    <div className="panel" style={{ padding: 32 }}>
      <div className="flex gap-2 mb-6">
        {(["url", "linkedin", "paste"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: "6px 14px",
              borderRadius: 9999,
              background: mode === m ? "var(--surface-2)" : "transparent",
              color: mode === m ? "var(--ink)" : "var(--ink-subtle)",
              fontSize: 13,
              fontWeight: 500,
              border: "1px solid " + (mode === m ? "var(--hairline-strong)" : "transparent"),
            }}
          >
            {m === "url" ? "From URL" : m === "linkedin" ? "LinkedIn" : "Paste text"}
          </button>
        ))}
      </div>

      {mode === "url" && (
        <div className="flex gap-2 mb-6">
          <input className="input" placeholder="https://company.com/jobs/123" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          <button className="btn-secondary whitespace-nowrap" onClick={fetchFromUrl} disabled={loading}>
            {loading ? "Fetching…" : "Fetch"}
          </button>
        </div>
      )}

      {mode === "linkedin" && (
        <div style={{ marginBottom: 16 }}>
          <div className="card" style={{ padding: 14, marginBottom: 12, borderLeft: "2px solid var(--primary)" }}>
            <div className="body-sm" style={{ color: "var(--ink-muted)", lineHeight: 1.6 }}>
              LinkedIn blocks most automated fetches. <strong style={{ color: "var(--ink)" }}>Paste the LinkedIn job URL below</strong> — we&apos;ll try to fetch it. If it fails, copy the job description from LinkedIn and switch to Paste text.
            </div>
          </div>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="https://www.linkedin.com/jobs/view/1234567890"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
            <button className="btn-secondary whitespace-nowrap" onClick={fetchFromUrl} disabled={loading}>
              {loading ? "Fetching…" : "Try fetch"}
            </button>
          </div>
        </div>
      )}

      {mode === "paste" && (
        <textarea
          className="input"
          rows={10}
          placeholder="Paste the full job listing here…"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          style={{ marginBottom: 16 }}
        />
      )}

      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field label="Job title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
        <Field label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
      </div>
      <Field label="Location (optional)" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />

      {mode === "url" && form.description && (
        <details style={{ marginTop: 16 }}>
          <summary className="caption" style={{ color: "var(--ink-subtle)", cursor: "pointer" }}>Preview description ({form.description.length} chars)</summary>
          <div className="body-sm" style={{ color: "var(--ink-muted)", marginTop: 8, maxHeight: 200, overflow: "auto" }}>{form.description}</div>
        </details>
      )}

      {error && <div className="caption" style={{ color: "#ff7676", marginTop: 16 }}>{error}</div>}

      <div className="flex justify-end gap-2" style={{ marginTop: 24 }}>
        <button className="btn-secondary" onClick={() => router.push("/")}>Cancel</button>
        <button className="btn-primary" onClick={save} disabled={loading}>{loading ? "Saving…" : "Save job"}</button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block" style={{ marginBottom: 8 }}>
      <span className="caption" style={{ color: "var(--ink-subtle)", display: "block", marginBottom: 4 }}>{label}</span>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
