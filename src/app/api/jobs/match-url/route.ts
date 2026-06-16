import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  const job = await prisma.job.findFirst({
    where: { url },
    include: { kit: { select: { coverLetter: true } } },
  });
  if (!job) return NextResponse.json({ error: "No matching job" }, { status: 404 });

  return NextResponse.json({
    id: job.id,
    title: job.title,
    company: job.company,
    coverLetter: job.kit?.coverLetter ?? null,
  });
}
