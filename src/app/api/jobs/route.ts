import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateMatchScore } from "@/lib/match";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const job = await prisma.job.create({
    data: {
      title: body.title,
      company: body.company,
      location: body.location || null,
      url: body.url || null,
      description: body.description,
      stage: "wishlist",
    },
  });
  // fire-and-forget — don't block the response
  calculateMatchScore(job.id).catch(() => {});
  return NextResponse.json(job);
}
