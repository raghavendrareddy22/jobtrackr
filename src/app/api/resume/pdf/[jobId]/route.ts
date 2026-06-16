import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deserializeKit } from "@/lib/kit";

export async function GET(_req: Request, ctx: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await ctx.params;
  const job = await prisma.job.findUnique({ where: { id: jobId }, include: { kit: true } });
  if (!job || !job.kit) return new NextResponse("Not found", { status: 404 });
  const kit = deserializeKit(job.kit);
  const r = kit.tailoredResume;

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(r.name)} — Resume</title>
<style>
  @page { size: letter; margin: 0.6in; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #111; max-width: 7.5in; margin: 0 auto; padding: 0.4in 0.5in; font-size: 11pt; line-height: 1.4; }
  h1 { font-size: 22pt; margin: 0 0 2px; }
  .contact { font-size: 9.5pt; color: #444; margin-bottom: 14px; }
  h2 { font-size: 10pt; letter-spacing: 1.5px; text-transform: uppercase; border-bottom: 1px solid #111; padding-bottom: 2px; margin: 14px 0 6px; }
  .role { display: flex; justify-content: space-between; font-weight: bold; }
  ul { margin: 4px 0 8px; padding-left: 18px; }
  li { margin-bottom: 2px; }
  .skills { line-height: 1.5; }
  .print-btn { position: fixed; top: 12px; right: 12px; background: #5e6ad2; color: white; border: 0; padding: 8px 14px; border-radius: 8px; font-size: 13px; cursor: pointer; }
  @media print { .print-btn { display: none; } }
</style></head>
<body>
  <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  <h1>${escapeHtml(r.name)}</h1>
  <div class="contact">${escapeHtml(r.contact)}</div>
  <h2>Summary</h2>
  <p>${escapeHtml(r.summary)}</p>
  <h2>Skills</h2>
  <p class="skills">${r.skills.map(escapeHtml).join(" · ")}</p>
  <h2>Experience</h2>
  ${r.experience.map(e => `
    <div class="role"><span>${escapeHtml(e.title)}, ${escapeHtml(e.company)}</span><span>${escapeHtml(e.dates)}</span></div>
    <ul>${e.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join("")}</ul>
  `).join("")}
  <h2>Education</h2>
  ${r.education.map(e => `<div><b>${escapeHtml(e.school)}</b> — ${escapeHtml(e.degree)} (${escapeHtml(e.year)})</div>`).join("")}
</body></html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function escapeHtml(s: string) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
