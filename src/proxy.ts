import { type NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/server/better-auth";

/**
 * Next.js 16 Proxy for auth protection
 * Uses full session validation with database checks
 */
export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Protect dashboard routes - add more patterns as needed
  matcher: ["/dashboard/:path*"],
};
