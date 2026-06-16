import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callOpenRouter } from "@/lib/openrouter";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const raw = await callOpenRouter([
    {
      role: "system",
      content: 'You are a compensation analyst. Return ONLY valid JSON: {"low": <number>, "mid": <number>, "high": <number>, "currency": "USD", "period": "year", "note": "<1 sentence source note>"}. Use realistic 2024-2025 market data.',
    },
    {
      role: "user",
      content: `Estimate the salary range for:\nTitle: ${job.title}\nCompany: ${job.company}\nLocation: ${job.location ?? "US (remote)"}\n\nJob description excerpt:\n${job.description.slice(0, 1000)}`,
    },
  ], { json: true });

  try {
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "Could not parse salary estimate" }, { status: 500 });
  }
}
