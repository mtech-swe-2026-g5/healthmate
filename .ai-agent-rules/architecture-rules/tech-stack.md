# Tech Stack & Architectural Guidelines

## Core Technologies

### Package Manager — All packages to be installed using "pnpm" only
- **Package**: pnpm (v11.2.2, declared in `package.json` → `packageManager` field)
- **Commands**: `pnpm add`, `pnpm install`, `pnpm run`, `pnpm test`
- **Lock file**: `pnpm-lock.yaml` (never edit manually, always commit)

### Framework & Language
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 6 (strict mode)
- **Runtime**: Node.js 22

### Database & ORM
- **Database**: PostgreSQL (Vercel Postgres — free tier)
- **ORM**: Prisma
- Database schemas defined in `prisma/schema.prisma`
- Use Prisma Client for all database operations

### Cloud Storage
- **Provider**: Vercel Blob (free tier)
- Use for file uploads (profile photos, documents, reports)

### API Architecture
- **Style**: REST APIs
- Prefer Server Actions for internal mutations
- Use API route handlers for external integrations and webhooks

### UI & Styling
- **Styling**: Tailwind CSS 4
- Follow Tailwind utility-first approach
- Use `@tailwindcss/postcss` plugin (already configured)
- Component library can be added later (e.g., Shadcn UI + Radix UI)

### Forms & Validation
- **Form Management**: React Hook Form (when added)
- **Validation**: Zod (when added)
- Define Zod schemas for all form validations
- Use type-safe form handling with React Hook Form + Zod integration

### Testing
- **Unit / Integration Testing**: Vitest 4 + React Testing Library
- **Coverage**: V8 provider (`@vitest/coverage-v8`), thresholds: 90% lines, 90% branches
- **Environment**: jsdom
- **Reports**: JUnit XML → `./build/junit-report.xml`
- Write unit tests for critical business logic
- Tests live in `__tests__/` directory (mirrors `src/` structure)

### Deployment
- **Platform**: Vercel
- **CI/CD**: GitHub Actions (PR checks: lint → test → build)
- **Dependency updates**: Dependabot (weekly, auto-merge after CI passes)

## Architectural Patterns

### App Router Structure
- Use Next.js 16 App Router conventions
- Place routes in `src/app/` directory
- Use Server Components by default
- Mark Client Components with `'use client'` directive
- Leverage Server Actions for mutations

### Architecture: Feature-Driven
- Organize code by feature, not by technical layer
- Each feature module in `src/features/[feature-name]/`
- Features expose a public API via `index.ts`
- Cross-feature shared code in `src/features/shared/`

### Type Safety
- Maintain strict TypeScript configuration
- Define types for all API responses and database models
- Use Zod for runtime validation (when added)
- Generate Prisma types for database models

### Code Organization
- Components: `src/components/`
- UI Components: `src/components/ui/` (when added)
- Utilities: `src/lib/`
- App Routes: `src/app/`
- Features: `src/features/`
- Tests: `__tests__/`

### Best Practices
- Prefer server-side rendering and Server Components
- Use Client Components only when needed (interactivity, browser APIs)
- Keep business logic separate from UI components
- Validate all user inputs with Zod schemas
- Handle errors gracefully with proper error boundaries
- Write meaningful tests for critical paths
