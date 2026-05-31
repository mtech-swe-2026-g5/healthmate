# Error Handling & Logging Guide

## Core Principles

1. **Fail Fast, Fail Loudly**: Detect errors early and make them visible
2. **User-Friendly Messages**: Never expose technical details to end users
3. **Context is Key**: Always include relevant context when logging errors
4. **Type-Safe Errors**: Use TypeScript to define error types and shapes

## Error Types & Definitions

### Define Error Classes

Create custom error classes in feature modules:

```typescript
// features/appointments/types/errors.ts
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(
    public resourceType: string,
    public resourceId: string
  ) {
    super(`${resourceType} with id ${resourceId} not found`);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ConflictError extends Error {
  constructor(message: string = 'Scheduling conflict detected') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public operation: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}
```

### Result Pattern (Recommended for Server Actions)

```typescript
// features/shared/types/result.ts
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}
```

## Server-Side Error Handling

### API Route Handlers

```typescript
// app/api/appointments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { createAppointment } from '@/features/appointments';

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

### Error Handler Utility

```typescript
// lib/errors.ts
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        issues: error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
      { status: 400 }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A record with this value already exists' },
        { status: 409 }
      );
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }
  }

  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: error.message, field: error.field },
      { status: 400 }
    );
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof ConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  console.error('Unhandled error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

### Server Actions

Handle errors in Server Actions with proper feedback:

```typescript
// features/appointments/services/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { bookAppointment } from './api';
import type { BookingInput } from '../types';

export async function bookAppointmentAction(data: BookingInput) {
  try {
    const appointment = await bookAppointment(data);
    revalidatePath('/appointments');
    return { success: true, data: appointment };
  } catch (error) {
    if (error instanceof ConflictError) {
      return { success: false, error: 'This time slot is no longer available.' };
    }
    if (error instanceof ValidationError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to book appointment. Please try again.' };
  }
}
```

## Client-Side Error Handling

### Next.js Error Pages

```typescript
// app/error.tsx
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-3xl font-bold mb-4">Something went wrong</h2>
      <p className="text-gray-500 mb-6">We apologize for the inconvenience.</p>
      <button
        onClick={reset}
        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}
```

### Hook Error Handling

```typescript
// features/appointments/hooks/use-book-appointment.ts
import { useState } from 'react';
import { bookAppointmentAction } from '../services/actions';
import type { BookingInput } from '../types';

export function useBookAppointment() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const book = async (data: BookingInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await bookAppointmentAction(data);

      if (!result.success) {
        setError(result.error);
        return null;
      }

      return result.data;
    } catch (err) {
      const message = 'Failed to book appointment';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { book, isLoading, error };
}
```

## Logging Strategies

### Structured Logging

```typescript
// lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

export const logger = {
  debug: (message: string, context?: LogContext) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, context);
    }
  },

  info: (message: string, context?: LogContext) => {
    console.info(`[INFO] ${message}`, context);
  },

  warn: (message: string, context?: LogContext) => {
    console.warn(`[WARN] ${message}`, context);
  },

  error: (message: string, error?: unknown, context?: LogContext) => {
    console.error(`[ERROR] ${message}`, error, context);
  },
};
```

## Error Response Format

### API Error Response
```typescript
type ApiErrorResponse = {
  error: string;
  code?: string;
  field?: string;
  issues?: Array<{ path: string; message: string }>;
};
```

### Success Response
```typescript
type ApiSuccessResponse<T> = {
  data: T;
  message?: string;
};
```

## Best Practices

### Do's ✅
- Always catch and handle errors at appropriate boundaries
- Use typed error classes for predictable error scenarios
- Log errors with relevant context (user ID, action, data)
- Provide user-friendly error messages in the UI
- Validate all user inputs with Zod schemas
- Test error scenarios in unit tests
- Use Error Boundaries for React component errors
- Return structured error responses from APIs

### Don'ts ❌
- Never expose stack traces or technical details to users
- Don't swallow errors silently (always log or handle them)
- Don't use generic `catch (e)` without proper handling
- Don't log sensitive data (passwords, tokens, PII)
- Don't create error boundaries for every small component
- Don't retry failed operations without limits
- Don't use errors for control flow
