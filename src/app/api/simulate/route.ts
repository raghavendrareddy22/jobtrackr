import { NextRequest, NextResponse } from "next/server";
import { callOpenRouter } from "@/lib/openrouter";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { jobId, messages, phase } = await req.json();

  const resume = await prisma.resume.findFirst({ where: { isMaster: true } });
  const job = jobId ? await prisma.job.findUnique({ where: { id: jobId } }) : null;

  const context = [
    job ? `Job: ${job.title} at ${job.company}. Description: ${job.description.slice(0, 1500)}` : "",
    resume ? `Candidate resume: ${resume.rawText ?? resume.summary ?? ""}` : "",
  ].filter(Boolean).join("\n\n");

  if (phase === "question") {
    const turnCount = messages.filter((m: { role: string }) => m.role === "assistant").length;
    const isFirst = turnCount === 0;
    const isDone = turnCount >= 5;

    if (isDone) {
      return NextResponse.json({ done: true });
    }

    const system = `You are a professional interviewer conducting a ${job ? `${job.title} at ${job.company}` : "general job"} interview.
${context}
Ask ONE concise interview question per turn. Start with a warm opener if this is the first question.
Do NOT give feedback yet — just ask the question. Keep it under 3 sentences.
After 5 questions total you will score the candidate.`;

    const reply = await callOpenRouter([
      { role: "system", content: system },
      ...messages,
      ...(isFirst ? [] : [{ role: "user", content: "[Next question please]" }]),
    ]);

    return NextResponse.json({ question: reply, turnCount: turnCount + 1, total: 5 });
  }

  if (phase === "score") {
    const system = `You are a senior hiring manager scoring a mock interview for ${job ? `${job.title} at ${job.company}` : "a general role"}.
${context}
Review the full Q&A transcript below and return ONLY valid JSON:
{
  "overall": <0-100>,
  "grade": "<A/B/C/D>",
  "summary": "<2 sentence overall verdict>",
  "answers": [
    { "question": "<question text>", "score": <0-100>, "feedback": "<1-2 sentence feedback>" }
  ],
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"]
}`;

    const transcript = messages
      .filter((m: { role: string }) => m.role !== "system")
      .map((m: { role: string; content: string }) => `${m.role === "assistant" ? "Interviewer" : "Candidate"}: ${m.content}`)
      .join("\n\n");

    const raw = await callOpenRouter([
      { role: "system", content: system },
      { role: "user", content: `Transcript:\n\n${transcript}` },
    ], { json: true });

    try {
      return NextResponse.json(JSON.parse(raw));
    } catch {
      return NextResponse.json({ error: "Failed to parse score" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown phase" }, { status: 400 });
}
