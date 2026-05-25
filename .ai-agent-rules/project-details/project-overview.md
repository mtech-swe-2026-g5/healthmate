# HealthMate — Project Overview

## What is HealthMate?

HealthMate is a **clinic appointment scheduling system** designed for patients and doctors. It simplifies how clinics manage appointments end-to-end — from patient sign-up through booking, doctor scheduling, and follow-up reminders.

**Project type**: Academic / course project (Agile Software Processes — BITS M.Tech)

---

## Core Features

### 1. Patient Registration & Login (OAuth)
- One-click sign-in via Google / GitHub (OAuth only, no passwords)
- Patient profile with contact info and appointment history
- Role assigned automatically on first login (`PATIENT`)

### 2. Appointment Booking Flow
- Browse doctors by specialization
- View available time slots based on doctor schedule
- Select date, time, and provide a reason for visit
- Receive instant booking confirmation
- Conflict detection prevents double-booking

### 3. Doctor Dashboard with Schedule View
- Doctors see their daily/weekly appointment list
- Manage availability (set working hours per day of week)
- View patient details for each appointment
- Mark appointments as completed or no-show

### 4. Cancellation & Rescheduling Logic
- Patients can cancel or reschedule their own appointments
- Cancellation frees the time slot for other patients
- Rescheduling shows available alternative slots
- Confirmation sent on cancellation/rescheduling

### 5. SMS / Email Reminder Integration
- Automated reminders sent before appointments (e.g., 24h, 1h before)
- Support for both email and SMS channels
- Reminder status tracking (pending, sent, failed)
- Configurable reminder timing per appointment type

### 6. Analytics for Appointment Trends
- Dashboard showing appointment volume over time
- No-show rate tracking
- Doctor utilization metrics
- Busiest days/hours analysis
- Exportable reports

### 7. UI Polish for Mobile Usability
- Mobile-first responsive design
- Touch-friendly appointment booking
- Accessible forms (WCAG AA compliant)
- Clean, professional healthcare aesthetic

### 8. Testing Appointment Conflicts
- Prevent overlapping appointments for same doctor
- Detect and reject double-bookings at the same time slot
- Edge cases: back-to-back appointments, multi-slot bookings
- Comprehensive test coverage for scheduling logic

---

## Tech Stack

| Layer | Technology | Details |
|-------|-----------|---------|
| **Language** | TypeScript 6 | Strict mode |
| **Framework** | Next.js 16 | App Router, Server Components |
| **Styling** | Tailwind CSS 4 | Utility-first, `@tailwindcss/postcss` |
| **ORM** | Prisma | Type-safe database access |
| **Database** | PostgreSQL | Vercel Postgres (free tier) |
| **Cloud Storage** | Vercel Blob | Free tier, for file uploads |
| **Authentication** | OAuth only | NextAuth.js / Auth.js (Google, GitHub) |
| **API** | REST APIs | Server Actions for internal mutations |
| **Testing** | Vitest 4 | React Testing Library, V8 coverage |
| **Package Manager** | pnpm 11 | Declared in `package.json` |
| **Version Control** | Git / GitHub | Conventional commits |
| **CI/CD** | GitHub Actions | Lint → Test → Build on every PR |
| **Deployment** | Vercel | Auto-deploy on push to `main` |
| **Dependency Updates** | Dependabot | Weekly, auto-merge after CI |

---

## Architecture

**Feature-Driven Architecture** — code is organized by what it does (features), not by technical layer.

```
src/
├── app/                    # Next.js routes (thin, routing only)
│   ├── (auth)/            # Sign-in page
│   ├── (dashboard)/       # Authenticated app (appointments, doctors, etc.)
│   ├── (marketing)/       # Public landing page
│   └── api/               # REST API endpoints
├── components/            # Shared UI components
├── features/              # Feature modules (main development area)
│   ├── appointments/      # Booking, listing, cancellation, conflict detection
│   ├── auth/              # OAuth sign-in, session, role checks
│   ├── doctors/           # Profiles, schedule management, dashboard
│   ├── patients/          # Registration, profiles, history
│   ├── reminders/         # SMS/email reminder scheduling
│   ├── analytics/         # Trends, reports, metrics
│   └── shared/            # Cross-feature domain code
├── hooks/                 # Universal React hooks
├── lib/                   # Framework utilities (prisma, auth, errors)
├── middleware/            # Auth, rate limiting
└── types/                 # Global TypeScript types
```

Each feature exposes a **public API** via `index.ts`. Cross-feature imports use `@/features/[name]`.

---

## Domain Model

### Key Entities

| Entity | Description |
|--------|------------|
| **User** | Base account (OAuth profile, role) |
| **Patient** | Extends User — contact info, date of birth |
| **Doctor** | Extends User — specialization, license, bio, fee |
| **Schedule** | Doctor's weekly availability (day, start/end time, slot duration) |
| **Appointment** | Booking linking patient ↔ doctor at a date/time with status |
| **Reminder** | Scheduled notification (email/SMS) tied to an appointment |

### Key Enums

| Enum | Values |
|------|--------|
| **Role** | `PATIENT`, `DOCTOR`, `ADMIN` |
| **AppointmentStatus** | `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`, `NO_SHOW` |
| **ReminderType** | `EMAIL`, `SMS` |
| **ReminderStatus** | `PENDING`, `SENT`, `FAILED` |

---

## Development Workflow

### Local Setup

```bash
git clone https://github.com/mtech-swe-2026-g5/healthmate.git
cd healthmate
pnpm install
cp .env.sample .env     # Fill in values
pnpm dev                # http://localhost:3000
```

### Available Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Run production server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run Vitest (unit + integration tests) |

### Database Workflow

```bash
pnpm exec prisma migrate dev --name description   # Create migration
pnpm exec prisma db seed                            # Seed data
pnpm exec prisma studio                             # GUI browser
pnpm exec prisma generate                           # Regenerate client
```

### Git Workflow

- **Branching**: GitHub Flow (`feature/*`, `fix/*` → `main` via PR)
- **Commits**: Conventional Commits (`feat(scope): message`)
- **PRs**: Require CI pass (lint → test → build) + one review
- **Merge**: Squash and merge

---

## Current Status

- Initial Next.js 16 setup complete
- Landing page ("Coming Soon") implemented
- pnpm + Vitest + GitHub Actions CI configured
- Dependabot auto-updates enabled
- `.env` / `.env.sample` created
- AI agent coding rules configured in `.ai-agent-rules/`
- **Not yet implemented**: auth, booking, dashboards, database, API routes, reminders, analytics

---

## Team & Repository

- **Repository**: `https://github.com/mtech-swe-2026-g5/healthmate.git`
- **Course**: Agile Software Processes — BITS M.Tech, Semester 1
- **Node.js**: 22.x (declared in `package.json` engines)
- **Deployment target**: Vercel (free tier)
