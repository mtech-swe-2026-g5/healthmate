# Database & Prisma Guidelines

## Core Principles

1. **Schema First**: Design your database schema thoughtfully before implementation
2. **Migrations are Sacred**: Never edit migration files manually (except for renames)
3. **Type Safety**: Leverage Prisma's generated types for end-to-end type safety
4. **Performance by Default**: Use indexes, select fields wisely, avoid N+1 queries
5. **Development vs Production**: Different strategies for different environments

## Quick Reference

### File Locations

```
healthmate/
├── prisma.config.ts        # Prisma CLI config (datasource URL, seed, migrations)
├── prisma/
│   ├── schema.prisma       # Database schema definition
│   ├── migrations/         # Migration files (auto-generated)
│   └── seed.ts            # Seed data script
└── src/
    └── lib/
        ├── prisma.ts      # Prisma client singleton (with @prisma/adapter-pg)
        └── db.ts          # Database utilities (optional)
```

### Essential Commands

| Command | Purpose | Environment |
|---------|---------|-------------|
| `pnpm exec prisma migrate dev` | Create & apply migration | Development |
| `pnpm exec prisma migrate deploy` | Apply pending migrations | Production |
| `pnpm exec prisma migrate reset` | Reset database & reseed | Development |
| `pnpm exec prisma db push` | Sync schema without migration | Development (prototyping) |
| `pnpm exec prisma db seed` | Run seed script | Any |
| `pnpm exec prisma generate` | Regenerate Prisma Client | Any |
| `pnpm exec prisma studio` | Open database GUI | Development |
| `pnpm exec prisma format` | Format schema file | Any |

## Database: Vercel PostgreSQL

- **Provider**: PostgreSQL on Vercel (free tier)
- **Connection**: Use `DATABASE_URL` environment variable
- **Pooling**: Vercel handles connection pooling via their Postgres driver

```prisma
// prisma/schema.prisma (Prisma 7 — URL moved to prisma.config.ts)
datasource db {
  provider = "postgresql"
}
```

```typescript
// prisma.config.ts
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
```

## Prisma Schema Organization

### Recommended Schema Structure (HealthMate)

```prisma
// prisma/schema.prisma

// ============================================
// 1. Generator & Datasource
// ============================================
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// 2. Authentication Models
// ============================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified Boolean   @default(false)
  name          String
  role          Role      @default(PATIENT)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  patient       Patient?
  doctor        Doctor?
  sessions      Session[]

  @@index([email])
  @@map("users")
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@map("sessions")
}

// ============================================
// 3. Domain Models
// ============================================

model Patient {
  id          String   @id @default(cuid())
  userId      String   @unique
  phone       String?
  dateOfBirth DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  appointments Appointment[]

  @@map("patients")
}

model Doctor {
  id              String   @id @default(cuid())
  userId          String   @unique
  specialization  String
  licenseNumber   String   @unique
  bio             String?  @db.Text
  consultationFee Int?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  schedules    Schedule[]
  appointments Appointment[]

  @@index([specialization])
  @@map("doctors")
}

model Schedule {
  id        String   @id @default(cuid())
  doctorId  String
  dayOfWeek Int      // 0 = Sunday, 6 = Saturday
  startTime String   // "09:00"
  endTime   String   // "17:00"
  slotDuration Int   @default(30) // minutes
  isActive  Boolean  @default(true)

  doctor    Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)

  @@unique([doctorId, dayOfWeek])
  @@index([doctorId])
  @@map("schedules")
}

model Appointment {
  id        String            @id @default(cuid())
  patientId String
  doctorId  String
  dateTime  DateTime
  duration  Int               @default(30) // minutes
  status    AppointmentStatus @default(PENDING)
  reason    String?           @db.Text
  notes     String?           @db.Text
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt

  patient   Patient           @relation(fields: [patientId], references: [id], onDelete: Cascade)
  doctor    Doctor            @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  reminders Reminder[]

  @@index([patientId])
  @@index([doctorId])
  @@index([dateTime])
  @@index([status])
  @@index([doctorId, dateTime])
  @@map("appointments")
}

model Reminder {
  id            String       @id @default(cuid())
  appointmentId String
  type          ReminderType
  scheduledAt   DateTime
  sentAt        DateTime?
  status        ReminderStatus @default(PENDING)

  appointment   Appointment  @relation(fields: [appointmentId], references: [id], onDelete: Cascade)

  @@index([appointmentId])
  @@index([scheduledAt])
  @@index([status])
  @@map("reminders")
}

// ============================================
// 4. Enums
// ============================================

enum Role {
  PATIENT
  DOCTOR
  ADMIN
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
  NO_SHOW
}

enum ReminderType {
  EMAIL
  SMS
}

enum ReminderStatus {
  PENDING
  SENT
  FAILED
}
```

### Schema Organization Best Practices

1. **Logical Grouping** — Group models by feature with clear comment headers
2. **Field Order** — Primary key → core fields → foreign keys → timestamps → relations
3. **Use `@@map`** — Map model names to snake_case table names
4. **Appropriate Types** — Use `@db.Text` for long strings, `cuid()` for IDs

## Indexing Strategy

### When to Add Indexes
- ✅ Frequently used in WHERE clauses
- ✅ Used for sorting (ORDER BY)
- ✅ Used in JOINs (foreign keys)
- ✅ Composite indexes for common query patterns (e.g., `[doctorId, dateTime]` for schedule queries)
- ❌ Rarely queried fields
- ❌ Frequently updated fields (indexes slow down writes)

## Migration Management

### Development Workflow

```bash
# 1. Modify schema.prisma
# 2. Create and apply migration
pnpm exec prisma migrate dev --name descriptive_name

# 3. This will:
#   - Create SQL migration file in prisma/migrations/
#   - Apply migration to dev database
#   - Regenerate Prisma Client
#   - Run seed script (if configured)
```

### Production Workflow

```bash
# Apply pending migrations in production (Vercel runs this automatically)
pnpm exec prisma migrate deploy
```

### Migration Naming Convention

```bash
# ✅ Good: Clear, descriptive
pnpm exec prisma migrate dev --name init
pnpm exec prisma migrate dev --name add_appointment_status
pnpm exec prisma migrate dev --name create_reminders_table

# ❌ Bad: Vague
pnpm exec prisma migrate dev --name update
pnpm exec prisma migrate dev --name fix
```

## Prisma Client Setup (v7 — Driver Adapter)

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

## Query Optimization

### Select Only Needed Fields

```typescript
// ✅ Good
const appointments = await prisma.appointment.findMany({
  select: {
    id: true,
    dateTime: true,
    status: true,
    doctor: { select: { id: true, user: { select: { name: true } } } },
    patient: { select: { id: true, user: { select: { name: true } } } },
  },
});
```

### Avoid N+1 Queries

```typescript
// ❌ Bad: N+1 queries
const appointments = await prisma.appointment.findMany();
for (const apt of appointments) {
  const doctor = await prisma.doctor.findUnique({ where: { id: apt.doctorId } });
}

// ✅ Good: Single query with include
const appointments = await prisma.appointment.findMany({
  include: {
    doctor: { select: { id: true, specialization: true } },
  },
});
```

### Use Pagination

```typescript
const page = 1;
const pageSize = 20;

const appointments = await prisma.appointment.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { dateTime: 'desc' },
});

const total = await prisma.appointment.count();
```

## Seed Data

### Configure in prisma.config.ts

Seed is configured in `prisma.config.ts` (not `package.json` in Prisma 7):

```typescript
// prisma.config.ts
export default defineConfig({
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
  // ...
});
```

### Run Seed

```bash
pnpm db:seed
```

## Best Practices Summary

### Schema Design
✅ Use descriptive model and field names
✅ Group related models together
✅ Add indexes for frequently queried fields
✅ Document complex relations

❌ Don't use generic names like `Data`, `Info`
❌ Don't forget indexes on foreign keys
❌ Don't use `Json` as a shortcut for proper relations

### Migrations
✅ Use descriptive migration names
✅ Test migrations locally before pushing
✅ Keep migrations small and focused

❌ Don't edit migration files directly
❌ Don't use `migrate dev` in production
❌ Don't delete migration files

### Queries
✅ Select only needed fields
✅ Implement pagination for large datasets
✅ Use transactions for related operations

❌ Don't fetch all fields when only a few are needed
❌ Don't create N+1 query problems
❌ Don't fetch unbounded result sets
