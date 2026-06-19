import { AppShell } from "@/components/AppShell";
import { getSettings } from "@/lib/openrouter";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const s = await getSettings();
  return (
    <AppShell active="/settings">
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="display-md" style={{ marginBottom: 6 }}>Settings</h1>
        <p className="body" style={{ color: "var(--ink-muted)", marginBottom: 32 }}>
          Connect your API keys to unlock AI features and live job search. Your keys are stored only in your database.
        </p>
        <SettingsForm
          initial={{
            openrouterKey: s.openrouterKey ?? "",
            model: s.model,
            adzunaAppId: s.adzunaAppId ?? "",
            adzunaAppKey: s.adzunaAppKey ?? "",
            adzunaCountry: s.adzunaCountry ?? "in",
          }}
        />
      </main>
    </AppShell>
  );
}
