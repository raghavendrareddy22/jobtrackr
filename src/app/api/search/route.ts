import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { searchAdzuna } from "@/lib/adzuna";
import { searchRemotive } from "@/lib/remotive";
import { searchJobicy } from "@/lib/jobicy";

export async function POST(req: NextRequest) {
  try {
    const { what, where, count, sources } = await req.json();
    if (!what || typeof what !== "string") {
      return NextResponse.json({ error: "Enter a role keyword" }, { status: 400 });
    }

    const perSource = Math.ceil((count ?? 10) / (sources?.length ?? 1));
    const active: string[] = sources ?? ["adzuna"];

    const results = await Promise.allSettled([
      active.includes("adzuna") ? searchAdzuna({ what, where, count: perSource }) : Promise.resolve([]),
      active.includes("remotive") ? searchRemotive(what, perSource) : Promise.resolve([]),
      active.includes("jobicy") ? searchJobicy(what, perSource) : Promise.resolve([]),
    ]);

    const allJobs = [
      ...((results[0].status === "fulfilled" ? results[0].value : []) as { externalId?: string; title: string; company: string; location?: string; url?: string; description: string; salary?: string; source?: string }[]).map(j => ({ ...j, source: "adzuna" })),
      ...((results[1].status === "fulfilled" ? results[1].value : []) as { externalId?: string; title: string; company: string; location?: string; url?: string; description: string; salary?: string; source?: string }[]).map(j => ({ ...j, source: "remotive" })),
      ...((results[2].status === "fulfilled" ? results[2].value : []) as { externalId?: string; title: string; company: string; location?: string; url?: string; description: string; salary?: string; source?: string }[]).map(j => ({ ...j, source: "jobicy" })),
    ];

    const created: { id: string; title: string; company: string; source: string }[] = [];
    for (const j of allJobs) {
      if (!j.description) continue;
      const existing = j.url ? await prisma.job.findFirst({ where: { url: j.url } }) : null;
      if (existing) continue;
      const row = await prisma.job.create({
        data: {
          title: j.title,
          company: j.company,
          location: j.location || null,
          url: j.url || null,
          description: j.salary ? `${j.description}\n\n[Listed salary: ${j.salary}]` : j.description,
          stage: "wishlist",
          source: j.source,
        },
      });
      created.push({ id: row.id, title: row.title, company: row.company, source: j.source ?? "adzuna" });
    }

    const errors = results
      .map((r, i) => r.status === "rejected" ? `${["adzuna","remotive","jobicy"][i]}: ${r.reason}` : null)
      .filter(Boolean);

    return NextResponse.json({ created, found: allJobs.length, errors });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
