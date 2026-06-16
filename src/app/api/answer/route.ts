import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callOpenRouter } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const { question, jobContext } = await req.json();
    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Enter a question" }, { status: 400 });
    }
    const resume = await prisma.resume.findFirst({ where: { isMaster: true } });
    if (!resume) return NextResponse.json({ error: "Upload your master resume first." }, { status: 400 });

    const profile = {
      name: resume.name,
      summary: resume.summary,
      skills: JSON.parse(resume.skills || "[]"),
      experience: JSON.parse(resume.experience || "[]"),
      education: JSON.parse(resume.education || "[]"),
    };

    const answer = await callOpenRouter([
      {
        role: "system",
        content: "You write authentic, specific interview/application answers in the candidate's own first-person voice. Ground every claim in the candidate's real experience. ~120-160 words. No clichés, no generic filler, no 'I am writing to'.",
      },
      {
        role: "user",
        content: `QUESTION: ${question}\n\nCANDIDATE PROFILE (JSON):\n${JSON.stringify(profile, null, 2)}\n${jobContext ? `\nROLE CONTEXT:\n${jobContext}` : ""}\n\nWrite a strong first-person answer.`,
      },
    ]);

    return NextResponse.json({ answer });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
