import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, adminToken } from "@/lib/auth";
import { LOCALE_COOKIE, LOCALE_HEADER, isLocale, preferredLocale } from "@/lib/i18n";

/** The dashboard: one shared password, checked against a digest in a cookie. */
async function guardAdmin(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next();

  const expected = await adminToken();
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (expected && token === expected) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) return guardAdmin(request);

  // Already in a language. Carry it up to the root layout, which owns <html>
  // and otherwise has no way to see which language is being rendered below it.
  const first = pathname.split("/")[1];
  if (isLocale(first)) {
    const headers = new Headers(request.headers);
    headers.set(LOCALE_HEADER, first);
    return NextResponse.next({ request: { headers } });
  }

  // A public path with no language on it — usually `/`, sometimes an old link.
  // Send them to the language they chose last time, or the one their browser
  // asks for, and let the page they land on be the one they can read.
  const locale = preferredLocale(
    request.cookies.get(LOCALE_COOKIE)?.value,
    request.headers.get("accept-language")
  );
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/",
    "/about",
    "/contact",
    "/how-it-works",
    "/en",
    "/en/:path*",
    "/am",
    "/am/:path*",
    "/om",
    "/om/:path*",
  ],
};
