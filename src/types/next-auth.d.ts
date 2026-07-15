import type { DefaultSession } from "next-auth";
import { AuthenticatedUser } from "@/features/auth";

/**
 * Module augmentation to carry the application user id and role through
 * Auth.js sessions and JWTs. Roles map to the `roles` table names
 * (`patient`, `doctor`, `admin`).
 */
// eslint-disable-next-line
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
      // eslint-disable-next-line
    } & DefaultSession['user'] &
      AuthenticatedUser;
  }
}

// eslint-disable-next-line
declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    roleId: number;
    rememberMe?: boolean;
  }
}
