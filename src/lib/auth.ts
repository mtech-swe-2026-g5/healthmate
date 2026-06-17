import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { encode } from 'next-auth/jwt';

import { authConfig, SESSION_MAX_AGE_SHORT } from './auth.config';
// Import directly (not via the feature barrel) so client-only modules
// (LoginForm, useLogin → next-auth/react) stay out of this server/edge graph.
import { verifyUserCredentials } from '@/features/auth/services/login';
import { credentialsAuthorizeSchema } from '@/features/auth/types/schemas';

/**
 * Full Auth.js instance for the Node runtime. Adds the Credentials provider
 * (which needs bcrypt + Prisma) on top of the edge-safe `authConfig`.
 *
 * Session length is driven by the "remember me" choice: the custom `encode`
 * shortens the JWT lifetime when the user did not opt in, while the global
 * `maxAge` (30 days) applies when they did.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  jwt: {
    async encode(params) {
      if (params.token?.rememberMe === false) {
        params.maxAge = SESSION_MAX_AGE_SHORT;
      }
      return encode(params);
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        role: { label: 'Role', type: 'text' },
        rememberMe: { label: 'Remember me', type: 'text' },
      },
      async authorize(credentials) {
        const parsed = credentialsAuthorizeSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password, role, rememberMe } = parsed.data;
        const user = await verifyUserCredentials(email, password, role);
        if (!user) return null;

        return { ...user, rememberMe };
      },
    }),
  ],
});
