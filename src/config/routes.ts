/**
 * Central route access map for HealthMate portals.
 * Used by middleware, login redirects, and marketing CTAs.
 */

export type AppRole = 'patient' | 'doctor' | 'admin';

export type RouteAccess = 'public' | 'authOnly' | 'patient' | 'doctor' | 'authenticated';

export const roleHomes = {
  patient: '/dashboard',
  doctor: '/doctor',
  admin: '/doctor',
} as const satisfies Record<AppRole, string>;

export const publicRoutes = ['/'] as const;

export const authOnlyRoutes = ['/login', '/register'] as const;

/** Exact patient paths plus prefix rules handled in matchers. */
export const patientHome = '/dashboard';
export const doctorHome = '/doctor';

/**
 * Returns the default landing path after login for a role.
 * Unknown roles fall back to the patient home.
 */
export function getRoleHome(role: string | undefined | null): string {
  if (role === 'doctor' || role === 'admin') return roleHomes[role];
  return roleHomes.patient;
}

export function isPublicRoute(pathname: string): boolean {
  return publicRoutes.includes(pathname as (typeof publicRoutes)[number]);
}

export function isAuthOnlyRoute(pathname: string): boolean {
  return authOnlyRoutes.includes(pathname as (typeof authOnlyRoutes)[number]);
}

/**
 * Patient portal: dashboard, profile, and appointments (including book and detail).
 */
export function isPatientRoute(pathname: string): boolean {
  if (pathname === '/dashboard') return true;
  if (pathname === '/profile' || pathname.startsWith('/profile/')) return true;
  if (pathname === '/appointments') return true;
  if (pathname.startsWith('/appointments/')) return true;
  return false;
}

/**
 * Doctor portal under /doctor.
 */
export function isDoctorRoute(pathname: string): boolean {
  return pathname === '/doctor' || pathname.startsWith('/doctor/');
}

/**
 * Classify a page pathname for access control.
 * API routes are handled separately in middleware.
 */
export function matchRouteAccess(pathname: string): RouteAccess {
  if (isPublicRoute(pathname)) return 'public';
  if (isAuthOnlyRoute(pathname)) return 'authOnly';
  if (isPatientRoute(pathname)) return 'patient';
  if (isDoctorRoute(pathname)) return 'doctor';
  return 'authenticated';
}

export function canRoleAccessPath(
  role: string | undefined | null,
  pathname: string,
): boolean {
  const access = matchRouteAccess(pathname);
  if (access === 'public') return true;
  if (access === 'authOnly') return false; // logged-in users should leave these
  if (access === 'patient') return role === 'patient';
  if (access === 'doctor') return role === 'doctor' || role === 'admin';
  // authenticated: any logged-in role
  return !!role;
}

/**
 * Safe same-origin relative callback for post-login redirect.
 * Rejects absolute URLs, protocol-relative URLs, and paths the role cannot access.
 */
export function sanitizeCallbackUrl(
  callbackUrl: string | null | undefined,
  role: string | undefined | null,
): string | null {
  if (!callbackUrl) return null;
  if (!callbackUrl.startsWith('/') || callbackUrl.startsWith('//')) return null;
  if (callbackUrl.startsWith('/api')) return null;
  if (isAuthOnlyRoute(callbackUrl.split('?')[0] ?? callbackUrl)) return null;
  const pathOnly = callbackUrl.split('?')[0] ?? callbackUrl;
  if (!canRoleAccessPath(role, pathOnly)) return null;
  return callbackUrl;
}

/**
 * Prefer a safe callbackUrl; otherwise send the user to their role home.
 */
export function resolvePostLoginRedirect(
  role: string | undefined | null,
  callbackUrl?: string | null,
): string {
  return sanitizeCallbackUrl(callbackUrl, role) ?? getRoleHome(role);
}
