# Form Handling & Validation

## Core Stack

- **Form Management**: React Hook Form (when added)
- **Validation**: Zod (when added)
- **Submission**: Server Actions (preferred) or API Routes
- **UI**: Tailwind CSS styled form components

## Core Principles

1. **Schema-First**: Define Zod schemas first, derive TypeScript types from them
2. **Validate Everywhere**: Client-side for UX, server-side for security
3. **Type Safety**: End-to-end type safety from schema to submission
4. **Progressive Enhancement**: Forms work without JavaScript when using Server Actions
5. **User Feedback**: Clear, immediate validation feedback

## Schema Definition with Zod

### Appointment Booking Schema

```typescript
// features/appointments/types/schemas.ts
import { z } from 'zod';

export const bookingSchema = z.object({
  doctorId: z.string().min(1, 'Please select a doctor'),
  dateTime: z.coerce.date().refine(
    (date) => date > new Date(),
    'Appointment must be in the future'
  ),
  duration: z.number().min(15).max(120).default(30),
  reason: z.string().max(500, 'Reason must be under 500 characters').optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;
```

### Patient Registration Schema

```typescript
// features/patients/types/schemas.ts
import { z } from 'zod';

export const patientRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .regex(/^[+]?[0-9]{10,15}$/, 'Invalid phone number')
    .optional(),
  dateOfBirth: z.coerce.date().refine(
    (date) => date < new Date(),
    'Date of birth must be in the past'
  ).optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type PatientRegistrationInput = z.infer<typeof patientRegistrationSchema>;
```

### Doctor Schedule Schema

```typescript
// features/doctors/types/schemas.ts
import { z } from 'zod';

export const scheduleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  slotDuration: z.number().min(15).max(120).default(30),
  isActive: z.boolean().default(true),
}).refine(
  (data) => data.startTime < data.endTime,
  { message: 'End time must be after start time', path: ['endTime'] }
);

export type ScheduleInput = z.infer<typeof scheduleSchema>;
```

## React Hook Form Integration

### Basic Form Setup

```typescript
// features/appointments/components/booking-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookingSchema, type BookingInput } from '../types';
import { bookAppointmentAction } from '../services/actions';

export function BookingForm({ doctors }: BookingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
  });

  const onSubmit = async (data: BookingInput) => {
    const result = await bookAppointmentAction(data);

    if (result.success) {
      reset();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="doctorId" className="block text-sm font-medium text-gray-700">
          Doctor
        </label>
        <select
          {...register('doctorId')}
          id="doctorId"
          className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2"
          aria-invalid={errors.doctorId ? 'true' : 'false'}
        >
          <option value="">Select a doctor</option>
          {doctors.map((doc) => (
            <option key={doc.id} value={doc.id}>{doc.name}</option>
          ))}
        </select>
        {errors.doctorId && (
          <p className="text-sm text-red-600 mt-1">{errors.doctorId.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="dateTime" className="block text-sm font-medium text-gray-700">
          Date & Time
        </label>
        <input
          {...register('dateTime')}
          id="dateTime"
          type="datetime-local"
          className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2"
          aria-invalid={errors.dateTime ? 'true' : 'false'}
        />
        {errors.dateTime && (
          <p className="text-sm text-red-600 mt-1">{errors.dateTime.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Booking...' : 'Book Appointment'}
      </button>
    </form>
  );
}
```

## Server-Side Validation

### Server Action with Validation

```typescript
// features/appointments/services/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { bookingSchema, type BookingInput } from '../types';

export async function bookAppointmentAction(data: BookingInput) {
  const validationResult = bookingSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: validationResult.error.flatten().fieldErrors,
    };
  }

  try {
    const appointment = await prisma.appointment.create({
      data: {
        ...validationResult.data,
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

## Best Practices

### ✅ Do's
- Define Zod schemas first, derive TypeScript types
- Always validate on both client and server
- Use meaningful, user-friendly error messages
- Implement loading states during submission
- Reset forms after successful submission
- Disable submit button during submission
- Use accessible form markup (`<label>`, `aria-invalid`, `aria-describedby`)

### ❌ Don'ts
- Never trust client-side validation alone
- Don't expose sensitive error details to users
- Don't forget to handle edge cases
- Don't skip accessibility attributes
- Don't submit without user confirmation on destructive actions (cancel appointment)
