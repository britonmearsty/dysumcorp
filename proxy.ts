import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("better-auth.session_token");
  const { pathname } = request.nextUrl;

  // Protected routes
  const protectedRoutes = ["/dashboard", "/profile"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Redirect to auth if accessing protected route without session
  if (isProtectedRoute && !session) {
    const url = new URL("/auth", request.url);
    return NextResponse.redirect(url);
  }

  // Redirect to dashboard if accessing auth page with session
  if (pathname === "/auth" && session) {
    const url = new URL("/dashboard", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/auth"],
};
