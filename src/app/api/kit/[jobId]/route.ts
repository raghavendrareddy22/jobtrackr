import { NextResponse } from "next/server";
import { generateKit } from "@/lib/kit";

export async function POST(_req: Request, ctx: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await ctx.params;
    const kit = await generateKit(jobId);
    return NextResponse.json(kit);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
