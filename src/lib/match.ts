import { prisma } from "@/lib/db";
import { callOpenRouter } from "@/lib/openrouter";

export async function calculateMatchScore(jobId: string): Promise<number | null> {
  const [job, resume] = await Promise.all([
    prisma.job.findUnique({ where: { id: jobId } }),
    prisma.resume.findFirst({ where: { isMaster: true } }),
  ]);
  if (!job || !resume) return null;

  const resumeText = [
    resume.summary ?? "",
    `Skills: ${resume.skills}`,
    `Experience: ${resume.experience}`,
    `Education: ${resume.education}`,
  ].join("\n");

  const raw = await callOpenRouter([
    {
      role: "system",
      content:
        'You are a recruiter scoring résumé fit. Reply with ONLY a JSON object: {"score": <integer 0-100>}. ' +
        "Score based on skills match, experience level, and role relevance. Be realistic — 50 = average fit, 80+ = strong match.",
    },
    {
      role: "user",
      content: `JOB TITLE: ${job.title}\nCOMPANY: ${job.company}\n\nJOB DESCRIPTION:\n${job.description.slice(0, 3000)}\n\nCANDIDATE RÉSUMÉ:\n${resumeText.slice(0, 3000)}`,
    },
  ], { json: true });

  let score: number | null = null;
  try {
    const parsed = JSON.parse(raw);
    const n = Number(parsed.score);
    if (!isNaN(n)) score = Math.max(0, Math.min(100, Math.round(n)));
  } catch {
    // leave null
  }

  if (score !== null) {
    await prisma.job.update({ where: { id: jobId }, data: { matchScore: score } });
  }
  return score;
}
