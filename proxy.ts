import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Partner host (e.g. partner.thisisaround.de): serves only the link-only
 * partner onepager. "/" shows /preview; every other page path goes back to
 * "/", so the unreleased app is never reachable from that host. Assets,
 * API routes and the image optimizer stay available for the page itself.
 */
const PARTNER_HOSTS = (process.env.PARTNER_PREVIEW_HOSTS || "partner.thisisaround.de")
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

function partnerResponse(request: NextRequest): NextResponse | null {
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  if (!PARTNER_HOSTS.includes(host)) return null;

  const { pathname } = request.nextUrl;
  if (pathname === "/robots.txt") {
    return new NextResponse("User-agent: *\nDisallow: /\n", { headers: { "content-type": "text/plain" } });
  }
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) return null;

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/preview";
    const res = NextResponse.rewrite(url);
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const partner = partnerResponse(request);
  if (partner) return partner;
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
