import { NextRequest, NextResponse } from "next/server";
import { fetchJobFromUrl } from "@/lib/scrape";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });
    const data = await fetchJobFromUrl(url);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
