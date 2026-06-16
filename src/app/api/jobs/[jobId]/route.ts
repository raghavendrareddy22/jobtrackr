import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await ctx.params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  for (const k of ["title", "company", "location", "url", "description", "notes"]) {
    if (k in body) data[k] = body[k] || null;
  }
  if ("title" in data && !data.title) delete data.title;
  if ("company" in data && !data.company) delete data.company;
  if ("description" in data && !data.description) delete data.description;
  if ("followUpAt" in body) data.followUpAt = body.followUpAt ? new Date(body.followUpAt) : null;
  const job = await prisma.job.update({ where: { id: jobId }, data });
  return NextResponse.json(job);
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await ctx.params;
  await prisma.job.delete({ where: { id: jobId } });
  return NextResponse.json({ ok: true });
}
