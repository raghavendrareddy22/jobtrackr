import { NextRequest, NextResponse } from "next/server";
import { callOpenRouter } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData();
    const file = fd.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    let text = "";
    if (file.name.endsWith(".pdf")) {
      const mod: any = await import("pdf-parse");
      const pdfParse = mod.default ?? mod;
      text = (await pdfParse(buf)).text;
    } else if (file.name.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      text = (await mammoth.extractRawText({ buffer: buf })).value;
    } else {
      text = buf.toString("utf8");
    }

    const SYSTEM = `Extract structured resume data from the text. Respond ONLY with valid JSON matching:
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "summary": "string",
  "skills": ["array of strings"],
  "experience": [{"company":"","title":"","start":"","end":"","bullets":["..."]}],
  "education": [{"school":"","degree":"","year":""}]
}`;
    const raw = await callOpenRouter(
      [
        { role: "system", content: SYSTEM },
        { role: "user", content: `Resume text:\n\n${text.slice(0, 15000)}` },
      ],
      { json: true }
    );
    let parsed;
    try { parsed = JSON.parse(raw); } catch {
      const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : {};
    }
    parsed.rawText = text;
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
