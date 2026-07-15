/**
 * Throws when the user's role is not in the allowed set. Use inside protected
 * Server Actions and sensitive API routes after resolving the session.
 *
 * @param userRole - The authenticated user's role (`patient` | `doctor` | `admin`).
 * @param allowedRoles - Roles permitted to perform the action.
 */
export function requireRole(userRole: string, allowedRoles: string[]): void {
  if (!allowedRoles.includes(userRole)) {
    throw new Error("Forbidden");
  }
}
