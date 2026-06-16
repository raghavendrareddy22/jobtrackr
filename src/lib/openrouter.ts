import { prisma } from "@/lib/db";

export async function getSettings() {
  let s = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (!s) {
    s = await prisma.settings.create({ data: { id: "singleton" } });
  }
  return s;
}

export async function callOpenRouter(messages: { role: "system" | "user" | "assistant"; content: string }[], opts?: { json?: boolean }) {
  const s = await getSettings();
  if (!s.openrouterKey) throw new Error("OpenRouter API key not set. Open Settings to add one.");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${s.openrouterKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "JobTrackr",
    },
    body: JSON.stringify({
      model: s.model,
      messages,
      ...(opts?.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${txt.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}
