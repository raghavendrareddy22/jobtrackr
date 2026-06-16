"use client";

import { useState } from "react";

type Exp = { company: string; title: string; start: string; end: string; bullets: string[] };
type Edu = { school: string; degree: string; year: string };

type R = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  experience: Exp[];
  education: Edu[];
};

const empty: R = { name: "", email: "", phone: "", location: "", summary: "", skills: [], experience: [], education: [] };

export function ResumeEditor({ initial }: { initial: R | null }) {
  const [r, setR] = useState<R>(initial ?? empty);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/resume/parse", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setR((prev) => ({ ...prev, ...data, skills: data.skills || prev.skills, experience: data.experience || prev.experience, education: data.education || prev.education }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/resume", { method: "POST", body: JSON.stringify(r) });
      const data = await res.json();
      setR((p) => ({ ...p, id: data.id }));
      setSavedAt(new Date().toLocaleTimeString());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="panel" style={{ padding: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div className="eyebrow" style={{ color: "var(--ink-subtle)" }}>Upload your resume</div>
            <p className="caption" style={{ color: "var(--ink-muted)", marginTop: 4 }}>AI will extract your info automatically. You can edit anything after.</p>
          </div>
        </div>
        <label
          style={{
            display: "block",
            border: "2px dashed var(--primary)",
            borderRadius: 12,
            padding: "32px 24px",
            textAlign: "center",
            cursor: "pointer",
            background: "color-mix(in oklab, var(--surface-1), var(--primary) 5%)",
          }}
        >
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            style={{ display: "none" }}
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
          />
          {uploading ? (
            <div>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
              <div style={{ fontWeight: 600, color: "var(--primary)" }}>Parsing your resume…</div>
              <div className="caption" style={{ color: "var(--ink-muted)", marginTop: 4 }}>AI is extracting your info</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
              <div style={{ fontWeight: 600, color: "var(--ink)" }}>Click to upload your resume</div>
              <div className="caption" style={{ color: "var(--ink-muted)", marginTop: 4 }}>PDF, DOCX, or TXT · AI fills in the fields below</div>
            </div>
          )}
        </label>
        {error && <div className="caption" style={{ color: "#ff7676", marginTop: 12 }}>❌ {error}</div>}
      </div>

      <div className="panel" style={{ padding: 32 }}>
        <div className="eyebrow" style={{ color: "var(--ink-subtle)", marginBottom: 16 }}>Contact</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Full name" value={r.name} onChange={(v) => setR({ ...r, name: v })} />
          <Field label="Email" value={r.email} onChange={(v) => setR({ ...r, email: v })} />
          <Field label="Phone" value={r.phone} onChange={(v) => setR({ ...r, phone: v })} />
          <Field label="Location" value={r.location} onChange={(v) => setR({ ...r, location: v })} />
        </div>
      </div>

      <div className="panel" style={{ padding: 32 }}>
        <div className="eyebrow" style={{ color: "var(--ink-subtle)", marginBottom: 12 }}>Summary</div>
        <textarea className="input" rows={4} value={r.summary} onChange={(e) => setR({ ...r, summary: e.target.value })} />
      </div>

      <div className="panel" style={{ padding: 32 }}>
        <div className="eyebrow" style={{ color: "var(--ink-subtle)", marginBottom: 12 }}>Skills (comma-separated)</div>
        <input className="input" value={r.skills.join(", ")} onChange={(e) => setR({ ...r, skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
      </div>

      <div className="panel" style={{ padding: 32 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="eyebrow" style={{ color: "var(--ink-subtle)" }}>Experience</div>
          <button className="btn-secondary" onClick={() => setR({ ...r, experience: [...r.experience, { company: "", title: "", start: "", end: "", bullets: [""] }] })}>+ Add role</button>
        </div>
        <div className="flex flex-col gap-4">
          {r.experience.map((e, i) => (
            <div key={i} className="card" style={{ padding: 20 }}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Title" value={e.title} onChange={(v) => updateExp(setR, r, i, { title: v })} />
                <Field label="Company" value={e.company} onChange={(v) => updateExp(setR, r, i, { company: v })} />
                <Field label="Start" value={e.start} onChange={(v) => updateExp(setR, r, i, { start: v })} />
                <Field label="End" value={e.end} onChange={(v) => updateExp(setR, r, i, { end: v })} />
              </div>
              <div className="caption" style={{ color: "var(--ink-subtle)", marginTop: 12, marginBottom: 4 }}>Bullets</div>
              <textarea className="input" rows={4} value={e.bullets.join("\n")} onChange={(ev) => updateExp(setR, r, i, { bullets: ev.target.value.split("\n") })} />
              <button className="caption" style={{ color: "#ff7676", marginTop: 8 }} onClick={() => setR({ ...r, experience: r.experience.filter((_, j) => j !== i) })}>Remove</button>
            </div>
          ))}
        </div>
      </div>

      <div className="panel" style={{ padding: 32 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="eyebrow" style={{ color: "var(--ink-subtle)" }}>Education</div>
          <button className="btn-secondary" onClick={() => setR({ ...r, education: [...r.education, { school: "", degree: "", year: "" }] })}>+ Add</button>
        </div>
        <div className="flex flex-col gap-3">
          {r.education.map((e, i) => (
            <div key={i} className="card grid grid-cols-3 gap-3" style={{ padding: 16 }}>
              <Field label="School" value={e.school} onChange={(v) => updateEdu(setR, r, i, { school: v })} />
              <Field label="Degree" value={e.degree} onChange={(v) => updateEdu(setR, r, i, { degree: v })} />
              <Field label="Year" value={e.year} onChange={(v) => updateEdu(setR, r, i, { year: v })} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3" style={{ position: "sticky", bottom: 20 }}>
        {savedAt && <span className="caption" style={{ color: "var(--ink-subtle)" }}>Saved {savedAt}</span>}
        <button className="btn-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save resume"}</button>
      </div>
    </div>
  );
}

function updateExp(set: (r: R) => void, r: R, i: number, patch: Partial<Exp>) {
  set({ ...r, experience: r.experience.map((e, j) => (j === i ? { ...e, ...patch } : e)) });
}
function updateEdu(set: (r: R) => void, r: R, i: number, patch: Partial<Edu>) {
  set({ ...r, education: r.education.map((e, j) => (j === i ? { ...e, ...patch } : e)) });
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="caption" style={{ color: "var(--ink-subtle)", display: "block", marginBottom: 4 }}>{label}</span>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
