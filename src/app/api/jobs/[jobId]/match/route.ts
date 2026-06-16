import { NextRequest, NextResponse } from "next/server";
import { calculateMatchScore } from "@/lib/match";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  try {
    const score = await calculateMatchScore(jobId);
    return NextResponse.json({ score });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
