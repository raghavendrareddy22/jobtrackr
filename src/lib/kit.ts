import { callOpenRouter } from "@/lib/openrouter";
import { prisma } from "@/lib/db";

export type Kit = {
  coverLetter: string;
  resumeBullets: string[];
  interviewQs: string[];
  companyBrief: string;
  atsScore: number;
  atsTips: string[];
  gapAnalysis: {
    matched: string[];
    missing: string[];
    verdict: string;
  };
  tailoredResume: {
    name: string;
    contact: string;
    summary: string;
    skills: string[];
    experience: { company: string; title: string; dates: string; bullets: string[] }[];
    education: { school: string; degree: string; year: string }[];
  };
};

const SYSTEM = `You are an expert career coach and resume writer. You produce ATS-friendly content that grabs an HR recruiter's attention in a single glance. Respond ONLY with valid JSON matching this exact schema:

{
  "coverLetter": "string - one-page tailored cover letter, plain text with paragraph breaks",
  "resumeBullets": ["array of exactly 4 rewritten resume bullets tailored to the job, action-verb led, quantified where possible"],
  "interviewQs": ["array of exactly 5 likely interview questions for this role"],
  "companyBrief": "string - one-page company brief covering: what they do, recent news/momentum, culture signals, why this role exists, smart questions to ask",
  "atsScore": "integer 0-100 estimating resume-to-JD match",
  "atsTips": ["3-5 specific tips to improve ATS score and recruiter scan-ability"],
  "gapAnalysis": {
    "matched": ["keywords/skills from the job description that the candidate's resume clearly demonstrates"],
    "missing": ["important keywords/skills/qualifications the job description asks for that the resume does NOT show"],
    "verdict": "string - 1-2 sentence honest assessment: is this job worth applying to given the gaps, and what single change would most improve the odds"
  },
  "tailoredResume": {
    "name": "string",
    "contact": "string - one line: email · phone · location · links",
    "summary": "string - 2-3 line professional summary tailored to JD keywords",
    "skills": ["array of 8-15 skills that match JD keywords"],
    "experience": [{"company": "...", "title": "...", "dates": "...", "bullets": ["3-5 bullets"]}],
    "education": [{"school": "...", "degree": "...", "year": "..."}]
  }
}`;

export async function generateKit(jobId: string): Promise<Kit> {
  const job = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });
  const resume = await prisma.resume.findFirst({ where: { isMaster: true } });
  if (!resume) throw new Error("Upload a master resume first.");

  const resumeContext = {
    name: resume.name,
    email: resume.email,
    phone: resume.phone,
    location: resume.location,
    summary: resume.summary,
    skills: JSON.parse(resume.skills || "[]"),
    experience: JSON.parse(resume.experience || "[]"),
    education: JSON.parse(resume.education || "[]"),
  };

  const userMsg = `JOB POSTING
Title: ${job.title}
Company: ${job.company}
${job.location ? "Location: " + job.location + "\n" : ""}
Description:
${job.description}

CANDIDATE MASTER RESUME (JSON):
${JSON.stringify(resumeContext, null, 2)}

Tailor everything to maximize match with the JOB POSTING above. Return JSON only.`;

  const raw = await callOpenRouter(
    [
      { role: "system", content: SYSTEM },
      { role: "user", content: userMsg },
    ],
    { json: true }
  );

  let parsed: Kit;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Model returned non-JSON output.");
    parsed = JSON.parse(m[0]);
  }

  await prisma.generatedKit.upsert({
    where: { jobId },
    create: {
      jobId,
      coverLetter: parsed.coverLetter,
      resumeBullets: JSON.stringify(parsed.resumeBullets),
      interviewQs: JSON.stringify(parsed.interviewQs),
      companyBrief: parsed.companyBrief,
      atsScore: parsed.atsScore,
      atsTips: JSON.stringify(parsed.atsTips),
      gapAnalysis: JSON.stringify(parsed.gapAnalysis ?? { matched: [], missing: [], verdict: "" }),
      tailoredResume: JSON.stringify(parsed.tailoredResume),
    },
    update: {
      coverLetter: parsed.coverLetter,
      resumeBullets: JSON.stringify(parsed.resumeBullets),
      interviewQs: JSON.stringify(parsed.interviewQs),
      companyBrief: parsed.companyBrief,
      atsScore: parsed.atsScore,
      atsTips: JSON.stringify(parsed.atsTips),
      gapAnalysis: JSON.stringify(parsed.gapAnalysis ?? { matched: [], missing: [], verdict: "" }),
      tailoredResume: JSON.stringify(parsed.tailoredResume),
    },
  });

  // cache the match score on the job so the board can show it without loading the full kit
  await prisma.job.update({ where: { id: jobId }, data: { score: parsed.atsScore } });

  return parsed;
}

export function deserializeKit(k: {
  coverLetter: string;
  resumeBullets: string;
  interviewQs: string;
  companyBrief: string;
  atsScore: number;
  atsTips: string;
  gapAnalysis: string;
  tailoredResume: string;
}): Kit {
  let gap: Kit["gapAnalysis"];
  try {
    const g = JSON.parse(k.gapAnalysis || "{}");
    gap = { matched: g.matched ?? [], missing: g.missing ?? [], verdict: g.verdict ?? "" };
  } catch {
    gap = { matched: [], missing: [], verdict: "" };
  }
  return {
    coverLetter: k.coverLetter,
    resumeBullets: JSON.parse(k.resumeBullets),
    interviewQs: JSON.parse(k.interviewQs),
    companyBrief: k.companyBrief,
    atsScore: k.atsScore,
    atsTips: JSON.parse(k.atsTips),
    gapAnalysis: gap,
    tailoredResume: JSON.parse(k.tailoredResume),
  };
}
