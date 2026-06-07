import { compare } from 'bcryptjs';

import { prisma } from '@/lib/prisma';

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: string;
  roleId: number;
};

/**
 * Validates email/password against the stored credentials.
 *
 * Returns `null` for every failure mode (unknown email, inactive account,
 * wrong password, role mismatch) so callers can surface a single generic
 * error and never leak which check failed.
 *
 * @param email - Submitted email (case-insensitive).
 * @param password - Plain-text password to verify against the stored hash.
 * @param role - Optional role selected on the login screen; when provided the
 *   user's actual role must match (prevents signing in via the wrong tab).
 */
export async function verifyUserCredentials(
  email: string,
  password: string,
  role?: string,
): Promise<AuthenticatedUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { role: true },
  });

  if (!user || !user.isActive) return null;

  const isValid = await compare(password, user.passwordHash);
  if (!isValid) return null;

  if (role && user.role.name !== role) return null;

  return {
    id: user.id,
    email: user.email,
    role: user.role.name,
    roleId: user.roleId,
  };
}
