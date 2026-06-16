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
        <div className="eyebrow" style={{ color: "var(--ink-subtle)" }}>AI — OpenRouter</div>
        <label>
          <span className="caption" style={{ color: "var(--ink-subtle)", display: "block", marginBottom: 4 }}>API key</span>
          <input className="input" type="password" placeholder="sk-or-…" value={v.openrouterKey} onChange={(e) => setV({ ...v, openrouterKey: e.target.value })} />
          <span className="caption" style={{ color: "var(--ink-tertiary)", display: "block", marginTop: 6 }}>Get one at openrouter.ai/keys</span>
        </label>
        <label>
          <span className="caption" style={{ color: "var(--ink-subtle)", display: "block", marginBottom: 4 }}>Model</span>
          <select className="input" value={v.model} onChange={(e) => setV({ ...v, model: e.target.value })} style={{ appearance: "none" }}>
            {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
      </div>

      <div className="panel flex flex-col gap-5" style={{ padding: 32 }}>
        <div className="eyebrow" style={{ color: "var(--ink-subtle)" }}>Job search — Adzuna</div>
        <div className="body-sm" style={{ color: "var(--ink-muted)", marginTop: -8 }}>
          Free for personal use. Register at developer.adzuna.com → create an app → copy the App ID and App Key.
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
