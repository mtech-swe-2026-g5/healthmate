import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/lib/auth.config";

/**
 * Centralised route protection (the story's recommended approach). Runs on the
 * edge using the edge-safe config only — the Credentials provider (bcrypt /
 * Prisma) stays out so this is edge-compatible.
 *
 * - Public pages and Auth.js / registration endpoints are always allowed.
 * - Unauthenticated requests to a protected API route get a 401 JSON response.
 * - Unauthenticated requests to a protected page are redirected to /login.
 * - Authenticated users are kept out of /login and /register.
 */
const { auth } = NextAuth(authConfig);

const PUBLIC_PAGES = ["/", "/login", "/register"];

export default auth((req) => {
  const { nextUrl } = req;
  const { pathname } = nextUrl;
  const isLoggedIn = !!req.auth?.user;

  // Auth.js endpoints + registration must stay open.
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Protected API routes answer with 401 rather than redirecting.
  if (pathname.startsWith("/api")) {
    if (!isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Signed-in users should not see the auth pages.
  if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Unauthenticated users hitting a protected page go to login.
  if (!isLoggedIn && !PUBLIC_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
