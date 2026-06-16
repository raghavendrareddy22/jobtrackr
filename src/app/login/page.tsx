import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="panel" style={{ padding: 40, width: "100%", maxWidth: 380 }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 24 }}>
          <span style={{ width: 18, height: 18, borderRadius: 4, background: "var(--primary)", display: "inline-block" }} />
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.2 }}>JobTrackr</span>
        </div>
        <h1 className="card-title" style={{ marginBottom: 6 }}>Sign in</h1>
        <p className="body-sm" style={{ color: "var(--ink-muted)", marginBottom: 24 }}>
          Enter the password to access your tracker.
        </p>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
