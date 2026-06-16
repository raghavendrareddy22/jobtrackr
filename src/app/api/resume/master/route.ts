import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const resume = await prisma.resume.findFirst({ where: { isMaster: true } });
  if (!resume) return NextResponse.json({ error: "No master resume" }, { status: 404 });
  return NextResponse.json(resume);
}
