# Feature-Driven Architecture Guide

## Core Principle

**Organize code by what it does (features), not what it is (technical layers).**

## Complete Project Structure

### Root Level
```
healthmate/
├── .ai-agent-rules/      # AI agent coding rules
├── .github/               # GitHub workflows, Dependabot config
│   └── workflows/
├── prisma/                # Prisma schema and migrations
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/                # Static assets
├── src/                   # Source code (detailed below)
├── __tests__/             # Test files (mirrors src/ structure)
├── .env                   # Local environment variables (gitignored)
├── .env.sample            # Environment variable template
├── .gitignore             # Git ignore rules
├── eslint.config.mjs      # ESLint configuration
├── next.config.ts         # Next.js configuration
├── package.json           # Dependencies and scripts
├── pnpm-lock.yaml         # pnpm lock file
├── pnpm-workspace.yaml    # pnpm workspace config
├── postcss.config.mjs     # PostCSS configuration
├── README.md              # Project overview and setup
├── tsconfig.json          # TypeScript configuration
└── vitest.config.mts      # Vitest test configuration
```

### Source Directory Structure
```
src/
├── app/                    # Next.js App Router pages and layouts
│   ├── (auth)/            # Route group: authentication pages
│   ├── (dashboard)/       # Route group: authenticated app
│   ├── (marketing)/       # Route group: public pages (landing, about)
│   ├── api/               # API routes (REST endpoints)
│   ├── error.tsx          # Global error boundary
│   ├── favicon.ico
│   ├── globals.css        # Global styles (Tailwind v4)
│   ├── layout.tsx         # Root layout
│   ├── loading.tsx        # Global loading state
│   ├── not-found.tsx      # Global 404 page
│   └── page.tsx           # Homepage
├── components/            # Shared UI components
│   ├── ui/               # Base UI components (buttons, inputs, cards)
│   └── ...               # Other universal UI components
├── config/               # Global configuration
│   ├── site.ts          # Site metadata, URLs, navigation
│   └── constants.ts     # Global constants
├── features/             # Feature modules (main development area)
│   ├── appointments/     # Appointment booking & management
│   ├── auth/             # Authentication & user management
│   ├── doctors/          # Doctor profiles & schedule management
│   ├── patients/         # Patient registration & profiles
│   ├── reminders/        # SMS/email reminder system
│   ├── analytics/        # Appointment trends & reporting
│   └── shared/           # Cross-feature domain code
├── hooks/                # Global hooks (truly universal)
│   ├── use-media-query.ts
│   └── use-mounted.ts
├── lib/                  # Core framework utilities
│   ├── db.ts            # Database utilities
│   ├── errors.ts        # Error handling utilities
│   ├── prisma.ts        # Prisma client setup
│   └── utils.ts         # General utilities (cn, formatters)
├── middleware/           # Middleware utilities
│   ├── auth.ts          # Authentication middleware helpers
│   └── rate-limit.ts    # Rate limiting utilities
└── types/                # Global TypeScript types
    ├── global.d.ts      # Global type augmentations
    └── index.ts         # Shared type definitions
```

## Feature Module Structure

### Standard Feature Layout

Every feature should follow this consistent structure:

```
features/[feature-name]/
├── components/
│   ├── component-name.tsx
│   ├── internal-component.tsx  # Not exported
│   └── index.ts               # Export only public components
├── hooks/
│   ├── use-feature-hook.ts
│   └── index.ts
├── services/
│   ├── actions.ts            # Server Actions
│   ├── api.ts                # API calls and external services
│   ├── queries.ts            # Data fetching functions
│   └── index.ts
├── types/
│   ├── schemas.ts            # Zod validation schemas
│   ├── types.ts              # TypeScript types
│   └── index.ts
├── utils/
│   ├── helpers.ts
│   └── index.ts
├── constants/                 # Feature-specific constants (optional)
│   └── index.ts
└── index.ts                   # Main feature export (public API)
```

### Public API Pattern

Each feature MUST expose a deliberate public API through `index.ts`:

```typescript
// features/appointments/index.ts
export { BookingForm, AppointmentCard, AppointmentList } from './components';
export { useBookAppointment, useAppointments } from './hooks';
export { bookAppointmentAction, cancelAppointmentAction } from './services';
export type { Appointment, BookingInput } from './types';
```

### Importing from Features

Always import from the feature's public API, never from internal paths:

```typescript
// ✅ Correct
import { BookingForm, useAppointments } from '@/features/appointments';
import { DoctorSchedule } from '@/features/doctors';

// ❌ Incorrect
import { BookingForm } from '@/features/appointments/components/booking-form';
import { useAppointments } from '@/features/appointments/hooks/use-appointments';
```

## HealthMate Feature Modules

### `features/appointments/`
- Booking flow (select doctor, time slot, confirm)
- Appointment listing and filtering
- Cancellation and rescheduling logic
- Conflict detection (double-booking prevention)

### `features/auth/`
- Patient sign-up and login
- Doctor/admin login
- Session management
- Password reset flow

### `features/doctors/`
- Doctor profiles and specializations
- Schedule/availability management
- Dashboard with daily/weekly view

### `features/patients/`
- Patient registration and profile management
- Appointment history
- Medical record references

### `features/reminders/`
- SMS reminder integration
- Email reminder integration
- Reminder scheduling and templates

### `features/analytics/`
- Appointment trend reports
- No-show tracking
- Clinic utilization metrics

## Next.js App Router Structure

### App Directory Organization

```
app/
├── (auth)/                   # Route group: auth pages
│   ├── layout.tsx
│   ├── sign-in/
│   │   └── page.tsx         # /sign-in
│   ├── sign-up/
│   │   └── page.tsx         # /sign-up
│   └── forgot-password/
│       └── page.tsx
├── (dashboard)/              # Route group: authenticated app
│   ├── layout.tsx           # Dashboard layout (sidebar, nav)
│   ├── dashboard/
│   │   └── page.tsx         # /dashboard
│   ├── appointments/
│   │   ├── page.tsx         # /appointments (list)
│   │   ├── new/
│   │   │   └── page.tsx     # /appointments/new (booking)
│   │   └── [id]/
│   │       └── page.tsx     # /appointments/:id (detail)
│   ├── doctors/
│   │   ├── page.tsx         # /doctors (list)
│   │   └── [id]/
│   │       └── page.tsx     # /doctors/:id (profile/schedule)
│   ├── patients/
│   │   └── page.tsx         # /patients
│   └── settings/
│       └── page.tsx         # /settings
├── (marketing)/              # Route group: public pages
│   ├── layout.tsx
│   └── page.tsx             # / (landing page)
├── api/                      # REST API routes
│   ├── appointments/
│   │   ├── route.ts         # GET/POST /api/appointments
│   │   └── [id]/
│   │       └── route.ts     # GET/PUT/DELETE /api/appointments/:id
│   ├── doctors/
│   │   └── route.ts
│   ├── health/
│   │   └── route.ts         # Health check endpoint
│   └── reminders/
│       └── route.ts
├── error.tsx
├── globals.css
├── layout.tsx
├── loading.tsx
└── not-found.tsx
```

### Special File Names

| File | Purpose | When Used |
|------|---------|-----------|
| `page.tsx` | Route UI component | Required for public routes |
| `layout.tsx` | Shared wrapper for child routes | Persistent nav, sidebar |
| `loading.tsx` | Loading fallback (auto Suspense) | Skeleton while data loads |
| `error.tsx` | Error boundary | Handle errors gracefully |
| `not-found.tsx` | 404 UI | Custom not found page |
| `route.ts` | API endpoint | Server-side REST handlers |

### API Route Best Practices

Keep routes thin, delegate to feature services:

```typescript
// app/api/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAppointments, createAppointment } from '@/features/appointments';
import { handleApiError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const appointments = await getAppointments();
    return NextResponse.json(appointments);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const appointment = await createAppointment(body);
    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

**Prefer Server Actions over API routes for internal mutations:**
- Server Actions have built-in CSRF protection
- Better type safety
- Easier to use with forms
- API routes are best for: external webhooks, third-party integrations, custom response headers

## Environment Configuration

### File Structure
```
healthmate/
├── .env                   # Local development (gitignored)
├── .env.sample            # Template with all required variables
└── .env.test              # Test environment (optional)
```

### Organization in .env.sample
```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL=

# Authentication (when configured)
# AUTH_SECRET=

# Email / SMS Reminders (when configured)
# SMTP_HOST=
# SMTP_PORT=
# SMTP_USER=
# SMTP_PASSWORD=
# SMS_API_KEY=
```

### Best Practices
- Keep `.env` in `.gitignore`
- Always maintain `.env.sample` with all variables (without values)
- Prefix client-side variables with `NEXT_PUBLIC_`
- Use different secrets for dev/staging/production

## State Management

### Client State
- **Component-local state**: `useState`, `useReducer`
- **Feature-specific state**: Custom hooks in features
- **Form state**: React Hook Form (when added)

### Server State
- **Initial data**: React Server Components
- **Mutations**: Server Actions

### Global State (use sparingly)
- Prefer URL state (`searchParams`) for shareable state
- Server Components for data that doesn't change often
- Local component state when possible

## Feature Independence Principles

1. **High Cohesion** — Keep related code together within a feature
2. **Explicit Dependencies** — Import from other features via public API
3. **Clear Boundaries** — Only export what needs to be public through `index.ts`
4. **Single Responsibility** — Each feature has a clear, focused purpose

## Anti-Patterns to Avoid

❌ **Don't:**
- Create "god features" that do everything
- Bypass the public API and import from internal paths
- Put business logic in components — use services/hooks
- Duplicate code — use `features/shared` for common domain code
- Create circular dependencies between features
- Store business logic in the app directory
- Use API routes when Server Actions suffice

✅ **Do:**
- Keep features focused and independent
- Use the public API for imports
- Delegate business logic to services
- Share truly common code via `features/shared`
- Keep `app/` directory thin (routing only)
- Prefer Server Actions for mutations
- Document complex features

## Best Practices Summary

### Directory Organization
- Organize by feature, not by technical layer
- Use route groups for layout organization
- Keep feature directories self-contained
- Maintain consistent structure across features

### Code Organization
- Export deliberate public APIs
- Keep business logic in services
- Use hooks for component logic
- Delegate to feature services from routes

### Dependencies
- Import from feature public APIs
- Minimize inter-feature dependencies
- Prefer props over global state
