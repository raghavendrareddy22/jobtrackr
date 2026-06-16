import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const logs = await prisma.activityLog.findMany({
    where: { jobId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(logs);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const { type, body } = await req.json();
  const log = await prisma.activityLog.create({ data: { jobId, type, body } });
  return NextResponse.json(log);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const { id } = await req.json();
  await prisma.activityLog.delete({ where: { id, jobId } });
  return NextResponse.json({ ok: true });
}
