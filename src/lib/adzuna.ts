import { getSettings } from "@/lib/openrouter";

export type AdzunaJob = {
  externalId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salary?: string;
};

// Adzuna API docs: https://developer.adzuna.com/
export async function searchAdzuna(opts: {
  what: string;
  where?: string;
  count?: number;
}): Promise<AdzunaJob[]> {
  const s = await getSettings();
  if (!s.adzunaAppId || !s.adzunaAppKey) {
    throw new Error("Adzuna App ID / Key not set. Add them in Settings.");
  }
  const country = (s.adzunaCountry || "in").toLowerCase();
  const count = Math.min(Math.max(opts.count ?? 10, 1), 50);

  const params = new URLSearchParams({
    app_id: s.adzunaAppId,
    app_key: s.adzunaAppKey,
    results_per_page: String(count),
    what: opts.what,
    "content-type": "application/json",
  });
  if (opts.where) params.set("where", opts.where);

  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Adzuna ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  const results = Array.isArray(data.results) ? data.results : [];

  return results.map((r: Record<string, unknown>): AdzunaJob => {
    const company = (r.company as { display_name?: string })?.display_name ?? "Unknown";
    const location = (r.location as { display_name?: string })?.display_name ?? "";
    const min = r.salary_min as number | undefined;
    const max = r.salary_max as number | undefined;
    const salary = min && max ? `${Math.round(min).toLocaleString()}–${Math.round(max).toLocaleString()}` : undefined;
    return {
      externalId: String(r.id ?? r.adref ?? r.redirect_url ?? Math.random()),
      title: String(r.title ?? "Untitled role").replace(/<[^>]+>/g, ""),
      company,
      location,
      description: String(r.description ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      url: String(r.redirect_url ?? ""),
      salary,
    };
  });
}
