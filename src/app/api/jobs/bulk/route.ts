import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { ids, action, stage } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: "No ids" }, { status: 400 });

  if (action === "move" && stage) {
    await prisma.job.updateMany({ where: { id: { in: ids } }, data: { stage } });
  } else if (action === "delete") {
    await prisma.job.deleteMany({ where: { id: { in: ids } } });
  } else if (action === "archive") {
    await prisma.job.updateMany({ where: { id: { in: ids } }, data: { stage: "rejected" } });
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
