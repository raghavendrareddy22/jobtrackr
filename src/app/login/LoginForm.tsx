"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/login", { method: "POST", body: JSON.stringify({ password }) });
    setLoading(false);
    if (res.ok) {
      router.push(params.get("from") || "/");
      router.refresh();
    } else {
      setError("Wrong password");
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <input
        className="input"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
      />
      {error && <div className="caption" style={{ color: "#ff7676" }}>{error}</div>}
      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
