import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const fields = {
    openrouterKey: body.openrouterKey || null,
    model: body.model || "anthropic/claude-sonnet-4",
    adzunaAppId: body.adzunaAppId || null,
    adzunaAppKey: body.adzunaAppKey || null,
    adzunaCountry: body.adzunaCountry || "in",
  };
  const s = await prisma.settings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...fields },
    update: fields,
  });
  return NextResponse.json({ ok: true, id: s.id });
}
