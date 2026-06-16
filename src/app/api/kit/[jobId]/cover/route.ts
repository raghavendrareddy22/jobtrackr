import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await ctx.params;
  const { coverLetter } = await req.json();
  if (typeof coverLetter !== "string") {
    return NextResponse.json({ error: "coverLetter required" }, { status: 400 });
  }
  await prisma.generatedKit.update({ where: { jobId }, data: { coverLetter } });
  return NextResponse.json({ ok: true });
}
