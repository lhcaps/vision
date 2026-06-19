/**
 * Server-side route protection (Next.js 16 "proxy" convention).
 *
 * Bouncer ở edge: nếu request tới protected route KHÔNG có session cookie
 * thì redirect ngay tới /login (returnUrl). Nếu có cookie thì cho qua — API
 * AuthGuard sẽ là nơi xác thực thật sự (vì proxy không có quyền truy cập
 * Prisma/DB).
 *
 * Lợi ích:
 *  - Bot / user tắt JS: vẫn redirect, không render protected page trắng.
 *  - Không phụ thuộc client-side AuthGate duy nhất.
 *  - Static export / SSR có trảiềm nhất quán.
 *
 * Tắt / bật qua env:
 *  - NEXT_PUBLIC_AUTH_COOKIE_NAME (mặc định "qlv_session")
 *  - AUTH_PROTECTED_PREFIXES (CSV, mặc định cases,documents,imports,reports,settings,admin)
 *  - AUTH_PUBLIC_PATHS (CSV, mặc định login,api/auth/login)
 */

import { NextResponse, type NextRequest } from "next/server";

const DEFAULT_COOKIE_NAME = "qlv_session";
const DEFAULT_PROTECTED_PREFIXES = [
  "/cases",
  "/documents",
  "/imports",
  "/reports",
  "/settings",
  "/admin",
];
const DEFAULT_PUBLIC_PATHS = ["/login", "/api/auth/login"];

function getCookieName(): string {
  return process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME ?? DEFAULT_COOKIE_NAME;
}

/**
 * Match chính xác hoặc segment-prefix (kèm "/"). Tránh false positive khi
 * public/protected entry là "/admin" mà path lại là "/administrator".
 */
function matchesPath(pathname: string, entry: string): boolean {
  return pathname === entry || pathname.startsWith(`${entry}/`);
}

function isPublicPath(pathname: string, publicPaths: string[]): boolean {
  return publicPaths.some((p) => matchesPath(pathname, p));
}

function isProtectedPath(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => matchesPath(pathname, p));
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Bỏ qua: static, _next, favicon, public assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const publicPaths = (process.env.AUTH_PUBLIC_PATHS ?? DEFAULT_PUBLIC_PATHS.join(","))
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (isPublicPath(pathname, publicPaths)) {
    return NextResponse.next();
  }

  const protectedPrefixes = (process.env.AUTH_PROTECTED_PREFIXES ??
    DEFAULT_PROTECTED_PREFIXES.join(","))
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  // Nếu path không nằm trong protected list, cho qua (homepage, /login đã bỏ ở trên).
  if (!isProtectedPath(pathname, protectedPrefixes)) {
    return NextResponse.next();
  }

  const cookieName = getCookieName();
  const sessionCookie = request.cookies.get(cookieName);

  if (sessionCookie?.value) {
    return NextResponse.next();
  }

  const returnUrl = encodeURIComponent(pathname + (search ?? ""));
  const loginUrl = new URL("/login", request.nextUrl.origin);
  loginUrl.searchParams.set("returnUrl", returnUrl);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
