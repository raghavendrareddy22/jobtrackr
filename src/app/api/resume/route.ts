import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = {
    name: body.name || "",
    email: body.email || null,
    phone: body.phone || null,
    location: body.location || null,
    summary: body.summary || null,
    skills: JSON.stringify(body.skills || []),
    experience: JSON.stringify(body.experience || []),
    education: JSON.stringify(body.education || []),
    rawText: body.rawText || null,
    isMaster: true,
  };

  const existing = await prisma.resume.findFirst({ where: { isMaster: true } });
  const saved = existing
    ? await prisma.resume.update({ where: { id: existing.id }, data })
    : await prisma.resume.create({ data });
  return NextResponse.json({ id: saved.id });
}
