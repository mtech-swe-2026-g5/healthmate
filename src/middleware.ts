import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import {
  getRoleHome,
  isAuthOnlyRoute,
  isPublicRoute,
  matchRouteAccess,
} from "@/config/routes";
import { authConfig } from "@/lib/auth.config";

/**
 * Centralised route protection. Runs on the edge using the edge-safe config
 * only — Credentials (bcrypt / Prisma) stay out so this is edge-compatible.
 *
 * Access matrix (see `src/config/routes.ts`):
 * - Public pages are always allowed.
 * - Auth-only pages redirect signed-in users to their role home.
 * - Patient / doctor portals enforce role; wrong role → role home.
 * - Unauthenticated protected pages → /login?callbackUrl=…
 * - Protected APIs → 401 JSON when unauthenticated.
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const { pathname } = nextUrl;
  const isLoggedIn = !!req.auth?.user;
  const role = req.auth?.user?.role;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Razorpay webhooks are authenticated via signature, not session cookies.
  if (pathname === "/api/payments/webhook") {
    return NextResponse.next();
  }

  // Cron-like jobs authenticate via shared secret headers, not sessions.
  if (pathname === "/api/jobs/send-reminders") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin")) {
    if (!isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    if (!isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (isLoggedIn && isAuthOnlyRoute(pathname)) {
    return NextResponse.redirect(new URL(getRoleHome(role), nextUrl));
  }

  if (!isLoggedIn) {
    if (isPublicRoute(pathname) || isAuthOnlyRoute(pathname)) {
      return NextResponse.next();
    }
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  const access = matchRouteAccess(pathname);

  if (access === "patient" && role !== "patient") {
    return NextResponse.redirect(new URL(getRoleHome(role), nextUrl));
  }

  if (access === "doctor" && role !== "doctor") {
    return NextResponse.redirect(new URL(getRoleHome(role), nextUrl));
  }

  if (access === "admin" && role !== "admin") {
    return NextResponse.redirect(new URL(getRoleHome(role), nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
