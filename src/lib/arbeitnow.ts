export type ArbeitnowJob = {
  externalId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  postedAt: Date;
};

export async function searchArbeitnow(what: string, count = 10, hoursBack = 24): Promise<ArbeitnowJob[]> {
  const cutoff = Date.now() - hoursBack * 3600_000;
  const all: ArbeitnowJob[] = [];
  let page = 1;

  while (all.length < count && page <= 5) {
    const res = await fetch(
      `https://www.arbeitnow.com/api/job-board-api?page=${page}`,
      { headers: { Accept: "application/json" }, next: { revalidate: 0 } }
    );
    if (!res.ok) break;
    const data = await res.json();
    const jobs: Record<string, unknown>[] = Array.isArray(data.data) ? data.data : [];
    if (!jobs.length) break;

    for (const j of jobs) {
      const created = new Date(String(j.created_at ?? ""));
      if (created.getTime() < cutoff) break; // API returns newest first; stop when too old
      const title = String(j.title ?? "").toLowerCase();
      if (!what.split(" ").some((w) => title.includes(w.toLowerCase()))) continue;
      const desc = String(j.description ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 6000);
      if (desc.length < 50) continue;
      all.push({
        externalId: `arbeitnow-${j.slug ?? j.created_at}`,
        title: String(j.title ?? ""),
        company: String(j.company_name ?? ""),
        location: String(j.location ?? "Remote"),
        description: desc,
        url: String(j.url ?? ""),
        postedAt: created,
      });
      if (all.length >= count) break;
    }
    page++;
  }
  return all;
}
