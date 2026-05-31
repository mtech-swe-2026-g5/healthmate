# Performance & Monitoring Guidelines

## Core Principles
- Monitor what matters: user experience, errors, and business-critical flows
- Optimize for Core Web Vitals: LCP, INP, CLS
- Prevent performance regressions through continuous monitoring
- Leverage Next.js 16 built-in optimizations

## Core Web Vitals

Monitor and optimize for:
- **LCP (Largest Contentful Paint)**: < 2.5s
- **INP (Interaction to Next Paint)**: < 200ms
- **CLS (Cumulative Layout Shift)**: < 0.1

## Next.js Performance Optimizations

### Image Optimization
Always use Next.js Image component:
```typescript
import Image from 'next/image';

<Image
  src="/doctor-photo.jpg"
  alt="Dr. Smith"
  width={200}
  height={200}
  priority // Use for LCP images
/>
```

### Font Optimization
Use next/font for automatic font optimization (already configured with Geist):
```typescript
import { Geist } from 'next/font/google';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});
```

### Code Splitting
- Use dynamic imports for heavy components
- Route-based code splitting is automatic with App Router
- Lazy load below-the-fold content

```typescript
import dynamic from 'next/dynamic';

const AnalyticsChart = dynamic(() => import('./analytics-chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});
```

### Streaming & Suspense
```typescript
import { Suspense } from 'react';
import { AppointmentList } from '@/features/appointments';

export default function AppointmentsPage() {
  return (
    <div>
      <h1>Appointments</h1>
      <Suspense fallback={<AppointmentsSkeleton />}>
        <AppointmentList />
      </Suspense>
    </div>
  );
}
```

## Database Performance

### Prisma Query Optimization
- Use `select` to fetch only needed fields
- Implement proper indexes in `schema.prisma`
- Use `include` judiciously to avoid N+1 queries
- Leverage Prisma's query batching

```typescript
// ❌ Bad: Fetches all fields
const appointments = await prisma.appointment.findMany();

// ✅ Good: Fetches only needed fields
const appointments = await prisma.appointment.findMany({
  select: {
    id: true,
    dateTime: true,
    status: true,
    doctor: {
      select: { id: true, name: true },
    },
    patient: {
      select: { id: true, name: true },
    },
  },
});
```

### Connection Pooling
Configure Prisma client singleton for Vercel PostgreSQL:
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

## Caching Strategies

### React Cache
```typescript
import { cache } from 'react';
import { prisma } from '@/lib/prisma';

export const getDoctor = cache(async (id: string) => {
  return prisma.doctor.findUnique({ where: { id } });
});
```

### Route Segment Config
```typescript
// app/doctors/page.tsx
export const revalidate = 3600; // Revalidate every hour
```

## Health Checks

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: { database: 'ok' },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
```

## Performance Budget

- Initial bundle: < 200KB (gzipped)
- Route bundles: < 50KB (gzipped)
- LCP: < 2.5s
- INP: < 200ms
- CLS: < 0.1
- Time to Interactive: < 3.8s

## Performance Anti-Patterns

❌ **Don't:**
- Fetch data in client components when server components can do it
- Use `useEffect` for data fetching (use Server Components)
- Forget to memoize expensive computations
- Import entire libraries when tree-shaking is available
- Skip image optimization
- Leave `console.log` in production
- Fetch unnecessary data from database
- Skip error boundaries

✅ **Do:**
- Prefer Server Components for data fetching
- Use streaming and Suspense for better perceived performance
- Implement proper loading states
- Optimize images and fonts
- Set up proper error boundaries
- Optimize database queries
- Use proper caching strategies
- Profile and measure before optimizing

## Regular Audits

- Run Lighthouse audits regularly
- Monitor Core Web Vitals in production (Vercel Analytics)
- Review database query performance
- Check bundle sizes on each deploy
