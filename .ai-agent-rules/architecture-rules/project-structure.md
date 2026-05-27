# Feature-Driven Architecture Guide

## Core Principle

**Organize code by what it does (features), not what it is (technical layers).**

## Complete Project Structure

### Root Level
```
[project-name]/
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
│   ├── ([route-group])/   # Route group (layout wrapper, no URL segment)
│   ├── ([route-group])/   # Repeat per logical section of the app
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
│   ├── [feature-name]/  # One folder per feature (repeat as needed)
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
│   ├── [middleware].ts  # Middleware helpers (e.g. session, rate limit)
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
// features/[feature-name]/index.ts
export { FeatureComponent, FeatureList } from './components';
export { useFeatureData, useFeatureMutation } from './hooks';
export { createFeatureAction, updateFeatureAction } from './services';
export type { FeatureEntity, FeatureInput } from './types';
```

### Importing from Features

Always import from the feature's public API, never from internal paths:

```typescript
// ✅ Correct
import { FeatureComponent, useFeatureData } from '@/features/[feature-name]';
import { OtherFeatureComponent } from '@/features/[other-feature-name]';

// ❌ Incorrect
import { FeatureComponent } from '@/features/[feature-name]/components/feature-component';
import { useFeatureData } from '@/features/[feature-name]/hooks/use-feature-data';
```

## Feature Module Guidelines

### `features/[feature-name]/`

Each feature folder represents one cohesive domain capability. When defining a new feature:

- Give it a clear, focused responsibility (one primary user-facing capability)
- Keep UI, hooks, services, and types inside that folder
- Expose only what other features or routes need via `index.ts`
- Document non-obvious business rules in the feature README or inline where needed

### `features/shared/`

Use for code shared across multiple features (domain types, validators, mappers). Do not use `shared` as a dumping ground for unrelated utilities—those belong in `lib/`.

## Next.js App Router Structure

### App Directory Organization

```
app/
├── ([route-group])/          # Route group (no URL segment; shared layout)
│   ├── layout.tsx
│   └── [page-name]/
│       └── page.tsx         # /[page-name]
├── ([route-group])/          # Another route group (repeat as needed)
│   ├── layout.tsx
│   ├── [page-name]/
│   │   └── page.tsx         # /[page-name]
│   └── [feature-name]/      # Feature routes (repeat per feature)
│       ├── page.tsx         # /[feature-name] (list)
│       ├── new/
│       │   └── page.tsx     # /[feature-name]/new (create)
│       └── [id]/
│           └── page.tsx     # /[feature-name]/:id (detail)
├── api/                      # REST API routes
│   ├── [feature-name]/
│   │   ├── route.ts         # GET/POST /api/[feature-name]
│   │   └── [id]/
│   │       └── route.ts     # GET/PUT/DELETE /api/[feature-name]/:id
│   └── [system-endpoint]/
│       └── route.ts         # Ops/diagnostic endpoint (e.g. health check)
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
// app/api/[feature-name]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFeatureItems, createFeatureItem } from '@/features/[feature-name]';
import { handleApiError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const items = await getFeatureItems();
    return NextResponse.json(items);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const item = await createFeatureItem(body);
    return NextResponse.json(item, { status: 201 });
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
[project-name]/
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

# Secrets (when configured)
# APP_SECRET=

# External integrations (when configured)
# INTEGRATION_API_KEY=
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
