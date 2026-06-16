export async function fetchJobFromUrl(url: string): Promise<{ title: string; company: string; description: string; location?: string }> {
  const isLinkedIn = url.includes("linkedin.com/jobs");
  const jobIdMatch = url.match(/\/view\/(\d+)/);
  if (isLinkedIn && jobIdMatch) {
    try {
      const apiUrl = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobIdMatch[1]}`;
      const liRes = await fetch(apiUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml",
        },
      });
      if (liRes.ok) {
        const html = await liRes.text();
        const title = extractTag(html, "h2") ?? extractMeta(html, "og:title") ?? "LinkedIn Role";
        const company = extractTag(html, "a[class*=company]") ?? extractMeta(html, "og:site_name") ?? "LinkedIn Company";
        const desc = stripHtml(html);
        return { title: clean(title), company: clean(company), description: desc.slice(0, 8000) };
      }
    } catch { /* fall through to regular fetch */ }
  }

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
  });
  const html = await res.text();
  const title = extractMeta(html, "og:title") ?? extractTag(html, "title") ?? "Untitled role";
  const description = stripHtml(extractMeta(html, "og:description") ?? extractMainText(html) ?? "");
  const company = extractMeta(html, "og:site_name") ?? guessCompany(url);
  return { title: clean(title), company: clean(company), description, location: undefined };
}

function extractMeta(html: string, prop: string) {
  const r = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i");
  const m = html.match(r);
  return m?.[1];
}
function extractTag(html: string, tag: string) {
  const m = html.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, "i"));
  return m?.[1];
}
function extractMainText(html: string) {
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html;
  return body.slice(0, 20000);
}
function stripHtml(s: string) {
  return s.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function clean(s: string) {
  return s.replace(/\s+/g, " ").trim();
}
function guessCompany(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host.split(".")[0].replace(/^\w/, (c) => c.toUpperCase());
  } catch {
    return "Unknown";
  }
}
