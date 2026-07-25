import { AuthenticatedUser } from "@/features/auth/services/login";
import type { NextAuthConfig } from "next-auth";
import { type AdapterUser } from "@auth/core/adapters";

const SEVEN_DAYS = 7 * 24 * 60 * 60;
const THIRTY_MINUTES = 30 * 60;

/**
 * Auth.js uses one rolling JWT session cookie rather than the story's separate
 * access + refresh tokens. We map the story's lifetimes onto that single token
 * via "remember me", and keep both values in env vars (overridable):
 *   - "remember me" on  → 7 days  (the story's refresh-token horizon)
 *   - "remember me" off → 30 mins (the story's access-token lifetime)
 * Auth.js silently re-issues (refreshes) the token on activity, which replaces
 * the manual refresh endpoint + refresh_tokens table.
 */
export const SESSION_MAX_AGE =
  Number(process.env.AUTH_SESSION_MAX_AGE_SECONDS) || SEVEN_DAYS;
export const SESSION_MAX_AGE_SHORT =
  Number(process.env.AUTH_SESSION_MAX_AGE_SHORT_SECONDS) || THIRTY_MINUTES;

/**
 * Session lifetime for a login, driven by the "remember me" choice:
 * opted in (or unset) → long horizon; opted out → short. Used by the custom
 * `jwt.encode` in `auth.ts` to set each token's `maxAge`.
 */
export function resolveSessionMaxAge(rememberMe: boolean | undefined): number {
  return rememberMe === false ? SESSION_MAX_AGE_SHORT : SESSION_MAX_AGE;
}

/**
 * Edge-safe Auth.js configuration shared by the middleware and the full
 * Node runtime instance. It must not import anything that depends on Node
 * APIs (bcrypt, Prisma), so the Credentials provider lives in `auth.ts`.
 *
 * Route protection itself lives in `src/middleware.ts` (it needs to answer
 * pages and API routes differently — redirect vs 401), so there is no
 * `authorized` callback here.
 */
export const authConfig = {
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        // JWT payload carries the patient's identity + role (id, role name, and
        // role_id) so route handlers can authorize without a DB round-trip.
        token = { ...token, ...user };
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        const { sub, iat, exp, jti, ...user } = token;
        session.user = {
          ...session.user,
          ...user,
        } as AuthenticatedUser & AdapterUser;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
