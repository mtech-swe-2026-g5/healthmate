# Authentication & Security Guidelines

## Release strategy

**Initial release:** email/password authentication via **NextAuth.js (Auth.js) v5** at a **basic** level only—enough to sign in, hold a session, and enforce roles on protected routes.

**Deferred (not initial release):** OAuth providers (Google, GitHub, etc.). OAuth adds provider apps, redirect URIs, and extra failure modes; password auth is simpler to design, test, and ship when time to market matters.

## Implemented decisions (v1) — read before changing auth

The reference snippets further down show *both* a database-session/PrismaAdapter
setup and a JWT setup. The shipped implementation made these concrete choices;
keep them consistent:

- **JWT session strategy, no PrismaAdapter.** The schema's custom `User`/`Role`
  models (`roleId` Int, `passwordHash` non-null, lowercase role names) do not
  match the adapter's expected `User`/`Session`/`Account` shapes, so sessions are
  stateless JWTs in HTTP-only cookies. The `RefreshToken` (and `Session`) tables
  are **not** used — Auth.js manages token lifetime. Adding the adapter later
  would require adapter-shaped tables.
- **Roles are lowercase strings from the `roles` table** (`patient`, `doctor`,
  `admin`) — not a Prisma enum. Session/JWT carry `user.id`, `user.role` (name),
  and `user.roleId` (the `role_id` the story asks for); see
  `src/types/next-auth.d.ts`.
- **Split config for edge compatibility:** `src/lib/auth.config.ts` (edge-safe:
  session, pages, `authorized`/`jwt`/`session` callbacks, no Node deps) is used by
  `src/middleware.ts`; `src/lib/auth.ts` spreads it and adds the Credentials
  provider (bcrypt + Prisma, Node runtime) plus a custom `jwt.encode`.
- **Credentials verification** lives in `src/features/auth/services/login.ts`
  (`verifyUserCredentials`), returning `null` for every failure (unknown email,
  inactive account, wrong password, role mismatch) so sign-in shows one generic
  error.
- **One rolling JWT replaces the story's access + refresh tokens.** There is no
  separate refresh token, refresh endpoint, or `refresh_tokens`/`Session` table
  usage — Auth.js silently re-issues the session JWT on activity. The story's
  lifetimes are mapped onto that single token via "remember me" (custom
  `jwt.encode`), with values read from env (`AUTH_SESSION_MAX_AGE_SECONDS`,
  `AUTH_SESSION_MAX_AGE_SHORT_SECONDS`):
    - remember me **on** → 7 days (the story's refresh-token horizon)
    - remember me **off** → 30 minutes (the story's access-token lifetime)
- **`is_active` is enforced** in `verifyUserCredentials` — inactive users cannot
  sign in (returns the same generic `null`).
- **Route protection is centralised in `src/middleware.ts`:** protected pages
  redirect to `/login`; protected API routes (anything under `/api` except
  `/api/auth/*`) return `401 { error: 'Unauthorized' }`. There is no `authorized`
  callback in `auth.config.ts`.
- **No role selector on login.** One form serves all roles; the role is derived
  from the account after authentication and carried in the session.
  `verifyUserCredentials` still accepts an optional role for a future
  doctor-specific enforcement, but the login UI does not send one.
- **Session-aware navigation.** `MarketingNav` takes an `isLoggedIn` prop
  (server pages resolve it via `auth()`): signed-in users get a Dashboard link +
  logout, and the same nav is reused on `/dashboard` for consistency.
- **Routes:** sign-in is `/login` (not `/sign-in`); post-login redirect and the
  protected landing is `/dashboard`. Public pages: `/`, `/login`, `/register`.

## Must-have vs good-to-have

| Capability | Priority | Initial release |
|------------|----------|-----------------|
| Session-based authentication (JWT or database session via Auth.js) | **Must-have** | Yes — basic NextAuth setup |
| Role-based authorization (`PATIENT`, `DOCTOR`, `ADMIN`) | **Must-have** | Yes |
| Protected frontend routes (middleware + server checks) | **Must-have** | Yes |
| Secure session handling (HTTP-only cookies, sign-out, secret rotation) | **Must-have** | Yes |
| Email/password (Credentials) sign-in & sign-up | **Must-have** | Yes — primary auth method |
| OAuth (Google, GitHub, etc.) | Good-to-have | No — add in a later phase |
| Social login / one-click provider sign-in | Good-to-have | No |
| Advanced auth (MFA, magic links, passkeys) | Good-to-have | No |

Role separation and protected medical/appointment data make auth a **must-have from day one**, but that does **not** require OAuth—only a reliable session, roles, and route guards.

## Must-have capabilities (summary)

1. **Session-based authentication** — Auth.js issues and validates sessions (database sessions with Prisma adapter, or JWT strategy; pick one and stay consistent).
2. **Role-based authorization** — Every protected action checks `PATIENT`, `DOCTOR`, or `ADMIN`.
3. **Protected frontend routes** — Middleware redirects unauthenticated users; server components/actions re-check `auth()`.
4. **Secure session handling** — `AUTH_SECRET`, HTTP-only cookies, no tokens in client storage, explicit sign-out.

## Recommended library

- **NextAuth.js (Auth.js) v5** — App Router support, Credentials provider for password auth, session callbacks for roles.
- Do **not** introduce additional auth libraries for v1 unless there is a blocking gap.

## Feature structure

```
src/features/[feature-name]/
├── components/         # Sign-in form, sign-up form, session UI
├── hooks/              # useSession and related hooks
├── services/           # Credentials validation, role assignment, permissions
├── types/              # Auth types and Zod schemas
└── index.ts            # Public API exports
```

## Auth.js setup (basic — Credentials only)

### Configuration

```typescript
// lib/auth.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { compare } from 'bcryptjs';
import { prisma } from './prisma';
import { z } from 'zod';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database' }, // or 'jwt' — document choice in project README
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user?.passwordHash) return null;

        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
});
```

> **Note:** Hash passwords with **bcrypt** (or argon2) in sign-up/update flows only—never store plain text. Registration is a separate Server Action that creates `User` + role default, not an Auth.js provider.

### API route handler

```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
```

### Sign-in page (email/password)

```typescript
// app/([route-group])/sign-in/page.tsx
import { signIn } from '@/lib/auth';
import { AuthError } from 'next-auth';

export default function SignInPage() {
  return (
    <form
      action={async (formData) => {
        'use server';
        try {
          await signIn('credentials', {
            email: formData.get('email'),
            password: formData.get('password'),
            redirectTo: '/[page-name]', // e.g. home after login
          });
        } catch (error) {
          if (error instanceof AuthError) {
            // Handle invalid credentials — generic message only
          }
        }
      }}
    >
      <input name="email" type="email" required autoComplete="email" />
      <input name="password" type="password" required autoComplete="current-password" />
      <button type="submit">Sign in</button>
    </form>
  );
}
```

## Prisma schema (initial — password auth)

Auth.js with PrismaAdapter needs `User` and `Session`. Add `Account` / `VerificationToken` when OAuth is introduced later.

```prisma
enum Role {
  PATIENT
  DOCTOR
  ADMIN
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  passwordHash  String?   // Required for Credentials; null only before first password set
  role          Role      @default(PATIENT)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  sessions      Session[]
  // accounts   Account[]  // Uncomment when OAuth is added

  @@index([email])
  @@map("users")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("sessions")
}
```

### Role assignment

- New registrations default to `PATIENT`.
- `DOCTOR` and `ADMIN` are assigned by seed data or an admin-only flow—not self-service on sign-up.

## Route protection

### Middleware

```typescript
// middleware.ts
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const publicRoutes = ['/', '/sign-in', '/sign-up'];
  const isPublic = publicRoutes.some((route) => pathname === route);

  if (!req.auth && !isPublic) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
```

### Server component

```typescript
// app/([route-group])/[page-name]/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const session = await auth();
  if (!session) redirect('/sign-in');

  return <div>{/* authenticated UI */}</div>;
}
```

### API route

```typescript
// app/api/[feature-name]/route.ts
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // authenticated logic
}
```

## Role-based access control

### Roles

| Role | Typical access |
|------|----------------|
| `PATIENT` | Own profile and own appointments |
| `DOCTOR` | Own schedule and assigned appointments |
| `ADMIN` | Cross-user management and operational views |

### Permission helpers

```typescript
// features/[feature-name]/services/permissions.ts
import type { User } from '@prisma/client';

export function requireRole(
  userRole: string,
  allowedRoles: string[]
): void {
  if (!allowedRoles.includes(userRole)) {
    throw new Error('Forbidden');
  }
}

export function canAccessResource(
  user: User,
  resource: { ownerId: string }
): boolean {
  if (user.role === 'ADMIN') return true;
  return resource.ownerId === user.id;
}
```

### Server action with role check

```typescript
'use server';

import { auth } from '@/lib/auth';
import { requireRole } from '@/features/[feature-name]';

export async function protectedAction(data: unknown) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  requireRole(session.user.role, ['DOCTOR', 'ADMIN']);

  // proceed
}
```

## Environment variables (initial release)

```bash
# .env
AUTH_SECRET=your-random-secret-min-32-chars
AUTH_URL=http://localhost:3000

DATABASE_URL=postgresql://...
```

Do **not** require OAuth client IDs for local development or v1 deployment.

## Security best practices

### Passwords

- Minimum length enforced in Zod (e.g. 8+ characters).
- Hash with bcrypt (cost factor ≥ 10) or argon2 before persisting.
- Never log passwords or return “user not found” vs “wrong password” differently (use a generic sign-in error).

### Session management

- Auth.js uses HTTP-only cookies by default—do not mirror sessions in `localStorage`.
- Call `signOut()` on logout; invalidate server session when using database strategy.
- Rotate `AUTH_SECRET` in production on a defined schedule.

### Input validation

- Validate credentials and registration payloads with Zod on the server.
- Sanitize inputs before database writes (Prisma parameterized queries).

### CSRF

- Server Actions include CSRF protection.
- Auth.js protects its own auth routes.

### Error handling

```typescript
// ❌ "Invalid password for user@example.com"
// ✅ "Invalid email or password."
```

## Patient data privacy

- Store only fields required for scheduling and roles.
- Do not log emails, session tokens, or passwords.
- Plan audit logging for access to sensitive records (can be phased after v1).

## Deferred: OAuth (good-to-have)

When adding OAuth in a later phase:

1. Register providers in Auth.js (`Google`, `GitHub`, etc.).
2. Add `Account` and `VerificationToken` models to Prisma.
3. Add provider env vars (`GOOGLE_CLIENT_ID`, etc.) per environment.
4. Keep Credentials provider if password login should remain available.

Until then, **do not** implement OAuth-only flows or remove password support without an explicit product decision.

## Security checklist (initial release)

- [ ] Credentials sign-in and sign-up work end-to-end
- [ ] Passwords are hashed; none stored or logged in plain text
- [ ] `AUTH_SECRET` is set and not committed to git
- [ ] All routes are protected or explicitly listed as public
- [ ] Middleware and server `auth()` checks are in place
- [ ] Sessions use HTTP-only cookies (Auth.js default)
- [ ] Role checks on every protected Server Action and sensitive API route
- [ ] Generic error messages on failed sign-in
- [ ] Environment variables documented in `.env.sample` (no OAuth vars required for v1)
- [ ] OAuth providers **not** required for v1 (document as future work)
