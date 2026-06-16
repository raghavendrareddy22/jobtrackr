export type JobicyJob = {
  externalId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
};

export async function searchJobicy(what: string, count = 10): Promise<JobicyJob[]> {
  const url = `https://jobicy.com/api/v2/remote-jobs?count=${count}&keyword=${encodeURIComponent(what)}`;
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) return [];
  const data = await res.json();
  const jobs: Record<string, unknown>[] = Array.isArray(data.jobs) ? data.jobs : [];
  return jobs.slice(0, count).map((j) => ({
    externalId: `jobicy-${j.id}`,
    title: String(j.jobTitle ?? ""),
    company: String(j.companyName ?? ""),
    location: String(j.jobGeo ?? "Remote"),
    description: String(j.jobExcerpt ?? j.jobDescription ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 6000),
    url: String(j.url ?? ""),
  })).filter((j) => j.title && j.description.length > 50);
}
