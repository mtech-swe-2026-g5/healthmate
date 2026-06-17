import type { DefaultSession } from 'next-auth';

/**
 * Module augmentation to carry the application user id and role through
 * Auth.js sessions and JWTs. Roles map to the `roles` table names
 * (`patient`, `doctor`, `admin`).
 */
declare module 'next-auth' {
  interface User {
    role: string;
    roleId: number;
    rememberMe?: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      roleId: number;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    roleId: number;
    rememberMe?: boolean;
  }
}
