import { type NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Next.js 16 Proxy for auth protection
 * Uses cookie-based checks for fast route protection
 * Full session validation should be done in individual pages/routes
 */
export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  // Optimistically redirect unauthenticated users
  // Full auth checks should happen in pages/routes
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Protect dashboard routes - add more patterns as needed
  matcher: ["/dashboard/:path*"],
};
