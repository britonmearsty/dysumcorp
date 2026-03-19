import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionToken =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("better-auth.session_token.secure") ||
    request.cookies.get("__Secure-better-auth.session_token");

  const isAuthenticated = !!sessionToken;

  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAuthPage = pathname === "/auth";
  const isPublicPortal = pathname.startsWith("/portal/");
  const isApiRoute = pathname.startsWith("/api");
  const isAuthApi = pathname.startsWith("/api/auth");
  const isWebhookApi = pathname.startsWith("/api/webhooks");
  const isPublicApi =
    pathname.startsWith("/api/portals/public") ||
    pathname.startsWith("/api/portals/upload") ||
    pathname.startsWith("/api/portals/direct-upload") ||
    pathname.startsWith("/api/portals/stream-upload") ||
    pathname.startsWith("/api/portals/confirm-upload") ||
    pathname.startsWith("/api/portals/r2-presign") ||
    pathname.startsWith("/api/portals/r2-worker-context") ||
    pathname.startsWith("/api/portals/r2-confirm") ||
    pathname.startsWith("/api/portals/r2-status");

  if (isDashboardRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (
    isApiRoute &&
    !isAuthApi &&
    !isWebhookApi &&
    !isPublicApi &&
    !isAuthenticated
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
