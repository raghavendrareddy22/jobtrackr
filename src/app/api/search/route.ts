import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { searchAdzuna } from "@/lib/adzuna";
import { searchRemotive } from "@/lib/remotive";
import { searchJobicy } from "@/lib/jobicy";
import { searchArbeitnow } from "@/lib/arbeitnow";

type RawJob = {
  externalId?: string;
  title: string;
  company: string;
  location?: string;
  url?: string;
  description: string;
  salary?: string;
  source?: string;
  postedAt?: Date;
};

const SOURCES_COUNT = 4;

export async function POST(req: NextRequest) {
  try {
    const { what, where, count, sources, last24h } = await req.json();
    if (!what || typeof what !== "string") {
      return NextResponse.json({ error: "Enter a role keyword" }, { status: 400 });
    }

    const perSource = Math.ceil((count ?? 10) / (sources?.length ?? 1));
    const active: string[] = sources ?? ["adzuna", "remotive", "jobicy", "arbeitnow"];
    const hoursBack = last24h ? 24 : 72; // default 72h, strict 24h when toggled

    const results = await Promise.allSettled([
      active.includes("adzuna") ? searchAdzuna({ what, where, count: perSource, maxDaysOld: last24h ? 1 : 3 }) : Promise.resolve([]),
      active.includes("remotive") ? searchRemotive(what, perSource) : Promise.resolve([]),
      active.includes("jobicy") ? searchJobicy(what, perSource) : Promise.resolve([]),
      active.includes("arbeitnow") ? searchArbeitnow(what, perSource, hoursBack) : Promise.resolve([]),
    ]);

    const labels = ["adzuna", "remotive", "jobicy", "arbeitnow"];
    const allJobs: RawJob[] = [];
    for (let i = 0; i < SOURCES_COUNT; i++) {
      const r = results[i];
      if (r.status === "fulfilled") {
        (r.value as RawJob[]).forEach((j) => allJobs.push({ ...j, source: labels[i] }));
      }
    }

    // Apply 24h filter to sources that don't natively filter (remotive, jobicy)
    const cutoff = last24h ? Date.now() - 24 * 3600_000 : 0;
    const filtered = cutoff
      ? allJobs.filter((j) => !j.postedAt || j.postedAt.getTime() >= cutoff)
      : allJobs;

    // Dedupe identical postings re-listed per city: group by normalized title+company,
    // merge their locations into one entry instead of creating N near-identical board cards.
    const groups = new Map<string, { job: RawJob; locations: Set<string> }>();
    for (const j of filtered) {
      if (!j.description) continue;
      const key = `${j.title.trim().toLowerCase()}::${j.company.trim().toLowerCase()}`;
      const existing = groups.get(key);
      if (existing) {
        if (j.location) existing.locations.add(j.location);
      } else {
        groups.set(key, { job: j, locations: new Set(j.location ? [j.location] : []) });
      }
    }

    const created: { id: string; title: string; company: string; location?: string; source: string }[] = [];
    for (const { job: j, locations } of groups.values()) {
      const existing = j.url ? await prisma.job.findFirst({ where: { url: j.url } }) : null;
      if (existing) continue;
      const locList = [...locations];
      const location = locList.length === 0
        ? null
        : locList.length === 1
        ? locList[0]
        : `${locList[0]} +${locList.length - 1} more location${locList.length > 2 ? "s" : ""}`;
      const description = locList.length > 1
        ? `${j.description}\n\n[Open in ${locList.length} locations: ${locList.join(", ")}]`
        : j.description;
      const row = await prisma.job.create({
        data: {
          title: j.title,
          company: j.company,
          location,
          url: j.url || null,
          description: j.salary ? `${description}\n\n[Listed salary: ${j.salary}]` : description,
          stage: "wishlist",
          source: j.source,
        },
      });
      created.push({ id: row.id, title: row.title, company: row.company, location: row.location ?? undefined, source: j.source ?? "unknown" });
    }

    const errors = results
      .map((r, i) => r.status === "rejected" ? `${labels[i]}: ${r.reason}` : null)
      .filter(Boolean);

    return NextResponse.json({ created, found: allJobs.length, filtered: filtered.length, errors });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
