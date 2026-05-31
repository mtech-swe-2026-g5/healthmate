# Data Fetching & Component Patterns

## Core Principles

1. **Server by Default**: Use Server Components for data fetching whenever possible
2. **Client When Needed**: Only use Client Components for interactivity, browser APIs, or client-side state
3. **Cache Strategically**: Leverage Next.js caching for optimal performance
4. **Stream for UX**: Use Suspense and streaming for better perceived performance

## Server Components vs Client Components

### Decision Tree

```
Need interactivity (onClick, onChange, state)?
├─ Yes → Client Component ('use client')
└─ No → Can use Server Component (default)
    ├─ Need to fetch data?
    │   └─ Yes → Server Component (fetch directly)
    └─ Need browser APIs (localStorage, window)?
        ├─ Yes → Client Component ('use client')
        └─ No → Server Component (preferred)
```

### Server Components (Default)

```typescript
// app/(dashboard)/appointments/page.tsx
import { prisma } from '@/lib/prisma';
import { AppointmentCard } from '@/features/appointments';

export default async function AppointmentsPage() {
  const appointments = await prisma.appointment.findMany({
    orderBy: { dateTime: 'desc' },
    take: 20,
    include: {
      doctor: { select: { id: true, specialization: true, user: { select: { name: true } } } },
    },
  });

  return (
    <div>
      <h1>Your Appointments</h1>
      {appointments.map((apt) => (
        <AppointmentCard key={apt.id} appointment={apt} />
      ))}
    </div>
  );
}
```

### Client Components

```typescript
// features/appointments/components/booking-form.tsx
'use client';

import { useState } from 'react';
import { bookAppointmentAction } from '../services/actions';

export function BookingForm({ doctorId }: { doctorId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    await bookAppointmentAction(formData);
    setIsSubmitting(false);
  };

  return (
    <form action={onSubmit}>
      <input name="doctorId" value={doctorId} type="hidden" />
      {/* Form fields */}
    </form>
  );
}
```

## Server Actions vs API Routes

### Server Actions (Preferred for Mutations)

**When to use:**
- Form submissions
- Data mutations (create, update, delete)
- Operations that need automatic revalidation

```typescript
// features/appointments/services/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { bookingSchema } from '../types';

export async function bookAppointmentAction(formData: FormData) {
  const data = bookingSchema.parse({
    doctorId: formData.get('doctorId'),
    dateTime: formData.get('dateTime'),
    reason: formData.get('reason'),
  });

  try {
    const appointment = await prisma.appointment.create({
      data: {
        ...data,
        patientId: 'current-patient-id', // from session
      },
    });

    revalidatePath('/appointments');
    return { success: true, data: appointment };
  } catch (error) {
    return { success: false, error: 'Failed to book appointment' };
  }
}
```

### API Routes (REST Endpoints)

**When to use:**
- External integrations (webhook handlers)
- Non-form mutations
- Custom response headers/status codes
- Third-party service callbacks

```typescript
// app/api/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAppointments } from '@/features/appointments';
import { handleApiError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const appointments = await getAppointments();
    return NextResponse.json(appointments);
  } catch (error) {
    return handleApiError(error);
  }
}
```

## Data Fetching Patterns

### Parallel Data Fetching

```typescript
export default async function DoctorPage({ params }: { params: { id: string } }) {
  const [doctor, appointments, schedule] = await Promise.all([
    getDoctor(params.id),
    getDoctorAppointments(params.id),
    getDoctorSchedule(params.id),
  ]);

  return <DoctorDashboard doctor={doctor} appointments={appointments} schedule={schedule} />;
}
```

### Streaming with Suspense

```typescript
import { Suspense } from 'react';

export default function DashboardPage() {
  return (
    <div>
      <Suspense fallback={<UpcomingAppointmentsSkeleton />}>
        <UpcomingAppointments />
      </Suspense>

      <Suspense fallback={<AnalyticsSkeleton />}>
        <AppointmentAnalytics />
      </Suspense>
    </div>
  );
}
```

### Request Deduplication with React Cache

```typescript
import { cache } from 'react';
import { prisma } from '@/lib/prisma';

export const getDoctor = cache(async (id: string) => {
  return prisma.doctor.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true, image: true } } },
  });
});
```

## Caching Strategies

### Route Segment Config

```typescript
export const dynamic = 'force-dynamic'; // Always fresh data
export const revalidate = 3600; // Revalidate every hour
```

### Manual Revalidation

```typescript
'use server';
import { revalidatePath } from 'next/cache';

export async function cancelAppointmentAction(id: string) {
  await cancelAppointment(id);
  revalidatePath('/appointments');
  revalidatePath(`/appointments/${id}`);
}
```

## Loading States

```typescript
// app/(dashboard)/appointments/loading.tsx
export default function Loading() {
  return <AppointmentsSkeleton />;
}
```

## Best Practices

### ✅ Do's
- Fetch data in Server Components whenever possible
- Use Server Actions for mutations and form submissions
- Implement streaming with Suspense for better UX
- Cache data appropriately with revalidation strategies
- Use `cache()` for request deduplication
- Keep client bundles small (minimize `'use client'`)
- Add loading states for all async operations

### ❌ Don'ts
- Don't use `useEffect` for initial data fetching (use Server Components)
- Don't fetch data in Client Components unless necessary
- Don't forget to handle loading and error states
- Don't make unnecessary API routes (use Server Actions)
- Don't waterfall requests (use parallel fetching)
- Don't add `'use client'` to parent when only child needs it
