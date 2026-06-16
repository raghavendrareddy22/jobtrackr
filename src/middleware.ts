import { NextRequest, NextResponse } from "next/server";

// Protects every page/route except the login flow and static assets.
// Auth is a single shared password set via the APP_PASSWORD env var.
export function middleware(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  console.log("[Middleware] APP_PASSWORD env var:", password ? "SET" : "NOT SET");
  // If no password is configured, the app is open (e.g. local dev).
  if (!password) return NextResponse.next();

  const { pathname } = req.nextUrl;
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico";
  if (isPublic) return NextResponse.next();

  const cookie = req.cookies.get("jt_auth")?.value;
  if (cookie === password) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
