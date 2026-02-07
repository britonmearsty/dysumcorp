import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Define protected and public routes
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isApiRoute = pathname.startsWith("/api");

  // Public API routes
  const isAuthApi = pathname.startsWith("/api/auth");
  const isWebhookApi = pathname.startsWith("/api/webhooks");
  const isPublicPortalApi = pathname.startsWith("/api/portals/public");
  const isPublicUploadApi = pathname.startsWith("/api/portals/upload");

  // Public Page routes
  const isAuthPage = pathname.startsWith("/auth");
  const isPublicPortalPage = pathname.startsWith("/portal/");
  const isHomePage = pathname === "/";

  // 2. Check for session token
  // better-auth uses 'better-auth.session_token' by default, or 'better-auth.session_token.secure' in production
  // We check for either
  const sessionToken =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("better-auth.session_token.secure") ||
    request.cookies.get("__Secure-better-auth.session_token");

  // 3. Handle Dashboard Routes
  if (isDashboardRoute) {
    if (!sessionToken) {
      const url = request.nextUrl.clone();

      url.pathname = "/auth";

      return NextResponse.redirect(url);
    }
  }

  // 4. Handle API Routes
  if (
    isApiRoute &&
    !isAuthApi &&
    !isWebhookApi &&
    !isPublicPortalApi &&
    !isPublicUploadApi
  ) {
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
