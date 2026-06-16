export type RemotiveJob = {
  externalId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
};

export async function searchRemotive(what: string, count = 10): Promise<RemotiveJob[]> {
  const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(what)}&limit=${count}`;
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) return [];
  const data = await res.json();
  const jobs: Record<string, unknown>[] = Array.isArray(data.jobs) ? data.jobs : [];
  return jobs.slice(0, count).map((j) => ({
    externalId: `remotive-${j.id}`,
    title: String(j.title ?? ""),
    company: String(j.company_name ?? ""),
    location: String(j.candidate_required_location ?? "Remote"),
    description: String(j.description ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 6000),
    url: String(j.url ?? ""),
  })).filter((j) => j.title && j.description.length > 50);
}
