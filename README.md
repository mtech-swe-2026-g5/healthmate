# HealthMate: Appointment Scheduler

HealthMate is a clinic appointment scheduling system for patients and doctors. It covers sign-up, booking, doctor schedules, cancellations, and reminders.

**Course project**: Agile Software Processes — BITS M.Tech, Semester 1  
**Repository**: [github.com/mtech-swe-2026-g5/healthmate](https://github.com/mtech-swe-2026-g5/healthmate)

The app is in early development. The public home page is a pre-launch “coming soon” screen; database tooling and project conventions are in place for feature work.

---

## Planned features

- Patient registration and login (OAuth only — Google / GitHub)
- Appointment booking with conflict detection
- Doctor dashboard and weekly schedule management
- Cancellation and rescheduling
- SMS and email reminders
- Analytics for appointment trends
- Mobile-first, accessible UI
- Automated tests for scheduling edge cases

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js](https://nextjs.org) 16 (App Router) |
| UI | [React](https://react.dev) 19 |
| Language | [TypeScript](https://www.typescriptlang.org) 6 |
| Styling | [Tailwind CSS](https://tailwindcss.com) 4 |
| ORM | [Prisma](https://www.prisma.io) 7 |
| Database | PostgreSQL ([Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)) |
| Authentication | OAuth only — [Auth.js](https://authjs.dev) / NextAuth (planned) |
| Testing | [Vitest](https://vitest.dev) 4 + React Testing Library |
| Linting | [ESLint](https://eslint.org) (Next.js config) |
| CI/CD | GitHub Actions (lint → test → build) |
| Package manager | [pnpm](https://pnpm.io) 11 |
| Runtime | [Node.js](https://nodejs.org) 22.x |

---

## Prerequisites

- **Node.js** 22.x (see `engines` in `package.json`)
- **pnpm** 11 (enable via [Corepack](https://nodejs.org/api/corepack.html): `corepack enable && corepack prepare pnpm@11.2.2 --activate`)
- **Git**
- A **PostgreSQL** connection string (e.g. Vercel Postgres) for database commands

```bash
node -v    # v22.x
pnpm -v    # 11.x
git --version
```

---

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/mtech-swe-2026-g5/healthmate.git
cd healthmate
```

### 2. Install dependencies

```bash
pnpm install
```

`postinstall` runs `prisma generate` automatically.

### 3. Configure environment variables

```bash
cp .env.sample .env
```

Edit `.env` and set at least:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (required for Prisma CLI and the app) |
| `NEXT_PUBLIC_APP_URL` | Public app URL (default: `http://localhost:3000`) |

Optional (for auth and reminders, when implemented):

- `AUTH_SECRET`, `AUTH_URL` — Auth.js
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google OAuth
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` — GitHub OAuth
- SMTP / SMS variables — reminder delivery

See `.env.sample` for the full template and comments.

### 4. Database setup (Prisma 7)

Connection URLs are configured in `prisma.config.ts` (not in `schema.prisma`). The app uses `@prisma/adapter-pg` via `src/lib/prisma.ts`.

After `DATABASE_URL` is set and `prisma/schema.prisma` is ready:

```bash
# Create and apply the first migration
pnpm db:migrate -- --name init

# Load demo data (when seed script is configured)
pnpm db:seed

# Open Prisma Studio
pnpm db:studio
```

Other database commands:

| Command | Description |
|---------|-------------|
| `pnpm db:push` | Push schema to the DB without a migration (prototyping) |
| `pnpm db:migrate:deploy` | Apply pending migrations (production / CI) |
| `pnpm db:reset` | Reset database and re-run migrations + seed |

Migration SQL is stored under `prisma/migrations/` (empty until the first `db:migrate`).

### 5. Start the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the coming-soon home page.

### 6. (Optional) Production build

```bash
pnpm build
pnpm start
```

---

## Available scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the development server |
| `pnpm build` | Run `prisma generate`, then create a production build |
| `pnpm start` | Run the production server (after `build`) |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run Vitest |
| `pnpm db:migrate` | Create and apply a migration (`-- --name <name>`) |
| `pnpm db:migrate:deploy` | Apply pending migrations |
| `pnpm db:push` | Sync schema without a migration file |
| `pnpm db:seed` | Run the seed script |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:reset` | Reset DB, migrate, and seed |

---

## Project structure

```
healthmate/
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Version-controlled SQL migrations
│   └── seed.ts             # Seed script
├── prisma.config.ts        # Prisma CLI config (URL, migrations path, seed)
├── src/
│   ├── app/                # Next.js App Router (layout, pages, styles)
│   └── lib/
│       └── prisma.ts       # Prisma client singleton (PostgreSQL adapter)
├── __tests__/              # Vitest tests
├── .ai-agent-rules/        # Coding standards and architecture docs
├── .github/workflows/      # CI (PR checks) and Dependabot automation
├── .env.sample             # Environment variable template (committed)
├── package.json
└── README.md
```

Target layout for upcoming features (see `.ai-agent-rules/architecture-rules/project-structure.md`):

```
src/
├── app/(auth)/             # Sign-in
├── app/(dashboard)/        # Authenticated app
├── app/api/                # REST endpoints
├── features/               # Feature modules (appointments, auth, doctors, …)
├── components/
├── hooks/
└── middleware/
```

---

## Current status

### Done

- Next.js 16 project with App Router under `src/app/`
- Responsive “coming soon” landing page describing planned features
- **pnpm** workspace, **Vitest**, and **ESLint** configured
- **GitHub Actions**: lint → test → build on every PR
- **Dependabot** for dependency updates
- **Environment templates**: `.env.sample` (and local `.env`, gitignored) with `DATABASE_URL`, OAuth, and reminder placeholders
- **Prisma 7 scaffolding**: `prisma.config.ts`, `src/lib/prisma.ts` with `@prisma/adapter-pg`, `prisma/migrations/` folder, and `db:*` npm scripts
- **AI agent rules** in `.ai-agent-rules/` (architecture, database, OAuth-only auth, testing, DevOps)
- **OAuth-only authentication** documented (no email/password); implementation pending

### In progress / next up

- Finalize `prisma/schema.prisma` and run the initial migration against a real database
- Implement Auth.js with Google (and optional GitHub) providers
- Feature modules: appointments, doctors, patients, reminders, analytics

### Not yet implemented

- User sign-in and session handling
- Appointment booking, dashboards, and REST/API routes
- SMS/email reminders and analytics

For more detail, see [`.ai-agent-rules/project-details/project-overview.md`](.ai-agent-rules/project-details/project-overview.md).

---

## Contributing

- Use **GitHub Flow**: branch from `main` (`feature/*`, `fix/*`), open a PR
- Follow **Conventional Commits** (e.g. `feat(appointments): add slot picker`)
- PRs should pass CI (lint, test, build) and receive at least one review
- Merge via **squash and merge**

Agent and human coding guidelines live in `.ai-agent-rules/` and `AGENTS.md`.

---

## License

This project is for academic/course use unless otherwise specified by the repository owner.
