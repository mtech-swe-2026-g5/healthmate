# Authentication & Security Guidelines

## Authentication — OAuth Only

HealthMate uses **OAuth-only** authentication. There are no email/password flows. Users sign in exclusively through third-party OAuth providers (Google, GitHub, etc.).

### Recommended Library
- **NextAuth.js (Auth.js) v5** — the standard OAuth library for Next.js App Router
- Alternative: **Better Auth** with OAuth plugins

### Supported Providers (configure as needed)
- **Google** — primary provider (patients & doctors)
- **GitHub** — optional (developer/admin convenience)
- Additional providers can be added via Auth.js adapter config

### Why OAuth Only
- No password storage, hashing, or reset flows to maintain
- Leverages provider-level security (2FA, device verification)
- Simpler onboarding for patients (one-click sign-in)
- Reduced attack surface (no credential stuffing, no brute-force)

## Feature Structure

```
src/features/auth/
├── components/         # Sign-in button, provider picker, auth UI
├── hooks/             # useAuth, useSession hooks
├── services/          # Auth callbacks, role assignment logic
├── types/             # Auth types and schemas
└── index.ts           # Public API exports
```

## Auth.js Setup

### Configuration

```typescript
// lib/auth.ts
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Attach role and IDs to session
      session.user.id = user.id;
      session.user.role = user.role;
      return session;
    },
  },
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
});
```

### API Route Handler

```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
```

### Sign-In Page (OAuth buttons only)

```typescript
// app/(auth)/sign-in/page.tsx
import { signIn } from '@/lib/auth';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-sm w-full space-y-4 p-6">
        <h1 className="text-2xl font-bold text-center text-gray-900">
          Sign in to HealthMate
        </h1>
        <p className="text-sm text-gray-500 text-center">
          Choose a provider to continue
        </p>

        <form
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: '/dashboard' });
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Continue with Google
          </button>
        </form>

        <form
          action={async () => {
            'use server';
            await signIn('github', { redirectTo: '/dashboard' });
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Continue with GitHub
          </button>
        </form>
      </div>
    </div>
  );
}
```

## Prisma Schema for OAuth

Auth.js with PrismaAdapter requires these models:

```prisma
// prisma/schema.prisma — Auth models

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  role          Role      @default(PATIENT)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
  patient       Patient?
  doctor        Doctor?

  @@index([email])
  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
  @@map("accounts")
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

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}
```

## Route Protection

### Middleware Protection

```typescript
// middleware.ts
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const publicRoutes = ['/', '/sign-in'];
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

### Server Component Protection

```typescript
// app/(dashboard)/dashboard/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/sign-in');
  }

  return <Dashboard user={session.user} />;
}
```

### API Route Protection

```typescript
// app/api/appointments/route.ts
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Proceed with authenticated logic
}
```

## Role-Based Access Control

### Roles
- **PATIENT**: Can book/cancel own appointments, view own history
- **DOCTOR**: Can view/manage own schedule, see assigned appointments
- **ADMIN**: Full access to all features, analytics, user management

### Role Assignment
New OAuth users default to `PATIENT`. Admins can promote users to `DOCTOR` or `ADMIN` via a settings page or database seed.

### Permission Checks

```typescript
// features/auth/services/permissions.ts
import type { User, Appointment } from '@prisma/client';

export function canAccessAppointment(user: User, appointment: Appointment): boolean {
  if (user.role === 'ADMIN') return true;
  if (user.role === 'DOCTOR' && appointment.doctorId === user.doctor?.id) return true;
  if (user.role === 'PATIENT' && appointment.patientId === user.patient?.id) return true;
  return false;
}

export function requireRole(userRole: string, allowedRoles: string[]): void {
  if (!allowedRoles.includes(userRole)) {
    throw new Error('Forbidden');
  }
}
```

### Server Action with Role Check

```typescript
'use server';

import { auth } from '@/lib/auth';
import { requireRole } from '@/features/auth';

export async function updateDoctorScheduleAction(data: ScheduleInput) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  requireRole(session.user.role, ['DOCTOR', 'ADMIN']);

  // Proceed with update
}
```

## Environment Variables

### Required Variables

```bash
# .env
# Auth.js
AUTH_SECRET=your-random-secret-min-32-chars
AUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Database
DATABASE_URL=postgresql://...
```

### Security Rules
- Never commit `.env` to version control (already gitignored)
- Use different OAuth apps for dev/staging/production
- Store production secrets in Vercel environment variables
- Rotate `AUTH_SECRET` periodically in production

## Security Best Practices

### Session Management
- Auth.js manages sessions via HTTP-only cookies automatically
- Never expose session tokens in client code
- Implement proper sign-out that invalidates sessions
- Sessions are tied to the database via PrismaAdapter

### Input Validation
- Always validate on both client and server
- Use Zod schemas for type-safe validation
- Sanitize user inputs before database operations

### CSRF Protection
- Server Actions have built-in CSRF protection
- Auth.js handles CSRF for its own routes

### Error Handling

```typescript
// Never expose provider-specific errors to users
// ❌ "Google account not linked" → ✅ "Unable to sign in. Please try again."
// ❌ "Account suspended by provider" → ✅ "Unable to sign in. Please try again."
```

## Patient Data Privacy

- Store only necessary patient information
- OAuth profile data (name, email, avatar) stored automatically
- Log access to patient records (audit trail)
- Implement data deletion for patient requests
- Never expose patient data in logs or error messages

## Security Checklist

- [ ] All routes are protected or explicitly public
- [ ] OAuth providers configured with correct redirect URIs
- [ ] `AUTH_SECRET` is set and not committed to git
- [ ] Sessions use HTTP-only cookies (Auth.js default)
- [ ] CSRF protection is enabled (Server Actions + Auth.js)
- [ ] Error messages don't leak provider details
- [ ] Environment variables are not committed
- [ ] Database uses parameterized queries (Prisma handles this)
- [ ] Patient data is not exposed in logs
- [ ] Role-based access enforced on all protected actions
- [ ] No email/password endpoints exist (OAuth only)
