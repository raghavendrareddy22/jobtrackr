"use client";

import { useState } from "react";

const MODELS = [
  "anthropic/claude-sonnet-4",
  "anthropic/claude-opus-4",
  "anthropic/claude-3.5-sonnet",
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
  "google/gemini-2.0-flash-exp",
  "meta-llama/llama-3.3-70b-instruct",
];

const COUNTRIES = [
  ["in", "India"], ["us", "United States"], ["gb", "United Kingdom"],
  ["au", "Australia"], ["ca", "Canada"], ["de", "Germany"], ["sg", "Singapore"],
  ["nl", "Netherlands"], ["fr", "France"], ["za", "South Africa"],
];

type Init = { openrouterKey: string; model: string; adzunaAppId: string; adzunaAppKey: string; adzunaCountry: string };

export function SettingsForm({ initial }: { initial: Init }) {
  const [v, setV] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch("/api/settings", { method: "POST", body: JSON.stringify(v) });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="panel flex flex-col gap-5" style={{ padding: 32 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div className="eyebrow" style={{ color: "var(--ink-subtle)" }}>AI — OpenRouter</div>
            <p className="body-sm" style={{ color: "var(--ink-muted)", marginTop: 4 }}>
              Powers cover letters, resume tailoring, interview prep, and match scoring.
            </p>
          </div>
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, fontWeight: 600, color: "var(--primary)", whiteSpace: "nowrap", marginTop: 4 }}
          >
            Get free key →
          </a>
        </div>
        <label>
          <span className="caption" style={{ color: "var(--ink-subtle)", display: "block", marginBottom: 4 }}>API key</span>
          <input className="input" type="password" placeholder="sk-or-v1-…   (paste your key here)" value={v.openrouterKey} onChange={(e) => setV({ ...v, openrouterKey: e.target.value })} />
          <span className="caption" style={{ color: "var(--ink-tertiary)", display: "block", marginTop: 6 }}>
            Sign up free at openrouter.ai → Keys → Create key. Free credits included.
          </span>
        </label>
        <label>
          <span className="caption" style={{ color: "var(--ink-subtle)", display: "block", marginBottom: 4 }}>AI Model</span>
          <select className="input" value={v.model} onChange={(e) => setV({ ...v, model: e.target.value })} style={{ appearance: "none" }}>
            {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <span className="caption" style={{ color: "var(--ink-tertiary)", display: "block", marginTop: 6 }}>
            Claude Sonnet is recommended — fast, affordable, great at writing.
          </span>
        </label>
      </div>

      <div className="panel flex flex-col gap-5" style={{ padding: 32 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div className="eyebrow" style={{ color: "var(--ink-subtle)" }}>Job search — Adzuna</div>
            <p className="body-sm" style={{ color: "var(--ink-muted)", marginTop: 4 }}>
              Enables live job listings in Find Jobs. Free for personal use.
            </p>
          </div>
          <a
            href="https://developer.adzuna.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, fontWeight: 600, color: "var(--primary)", whiteSpace: "nowrap", marginTop: 4 }}
          >
            Register free →
          </a>
        </div>
        <div className="body-sm" style={{ color: "var(--ink-muted)", marginTop: -8, padding: "10px 14px", background: "var(--surface-2)", borderRadius: 8 }}>
          📋 <strong>How to get keys:</strong> Go to developer.adzuna.com → Sign up → &quot;Create an App&quot; → copy the App ID and Key from your dashboard.
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="caption" style={{ color: "var(--ink-subtle)", display: "block", marginBottom: 4 }}>App ID</span>
            <input className="input" value={v.adzunaAppId} onChange={(e) => setV({ ...v, adzunaAppId: e.target.value })} />
          </label>
          <label>
            <span className="caption" style={{ color: "var(--ink-subtle)", display: "block", marginBottom: 4 }}>App Key</span>
            <input className="input" type="password" value={v.adzunaAppKey} onChange={(e) => setV({ ...v, adzunaAppKey: e.target.value })} />
          </label>
        </div>
        <label>
          <span className="caption" style={{ color: "var(--ink-subtle)", display: "block", marginBottom: 4 }}>Default country</span>
          <select className="input" value={v.adzunaCountry} onChange={(e) => setV({ ...v, adzunaCountry: e.target.value })} style={{ appearance: "none" }}>
            {COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
          </select>
        </label>
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="caption" style={{ color: "var(--success)" }}>Saved</span>}
        <button className="btn-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
      </div>
    </div>
  );
}
