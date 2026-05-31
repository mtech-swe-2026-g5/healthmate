# Coding & Documentation Guidelines

## Code Style

### Formatting
- Use Prettier defaults (enforced via ESLint)
- 2-space indentation
- Single quotes for strings (except JSX attributes)
- Trailing commas in multi-line objects/arrays
- Semicolons required

### File Naming
- Components: `PascalCase.tsx` (e.g., `BookingForm.tsx`)
- Utilities/Hooks: `kebab-case.ts` (e.g., `use-appointments.ts`, `format-date.ts`)
- Types/Interfaces: `kebab-case.ts` (e.g., `appointment-types.ts`)
- Constants: `SCREAMING_SNAKE_CASE` in `kebab-case.ts` files

### Variable Naming
- **camelCase**: variables, functions, methods
- **PascalCase**: components, classes, types, interfaces
- **SCREAMING_SNAKE_CASE**: constants
- Boolean variables: prefix with `is`, `has`, `should` (e.g., `isBooked`, `hasConflict`)
- Event handlers: prefix with `handle` or `on` (e.g., `handleBooking`, `onCancel`)

## TypeScript

### Type Definitions
- Prefer `type` over `interface` for object shapes
- Use `interface` only for extensible contracts or when declaration merging is needed
- Export types from feature modules via `index.ts`
- Avoid `any` — use `unknown` if type is truly unknown

### Type Naming
- No `I` prefix for interfaces (use `User`, not `IUser`)
- Suffix props types with `Props` (e.g., `BookingFormProps`)
- Suffix input types with `Input` (e.g., `CreateAppointmentInput`)
- Suffix response types with `Response` (e.g., `ApiResponse`)

## Comments & Documentation

### When to Comment
✅ **Do comment:**
- Complex business logic (appointment conflict detection, scheduling algorithms)
- Non-obvious decisions or workarounds
- Public APIs and exported functions
- Regex patterns and magic numbers

❌ **Don't comment:**
- Obvious code (the code should be self-explanatory)
- Outdated information (update or remove)
- Commented-out code (use git history instead)

### Comment Style
```typescript
// Single-line comments for brief explanations

/**
 * Checks for scheduling conflicts with existing appointments.
 * @param doctorId - The doctor's unique identifier
 * @param startTime - Proposed appointment start time
 * @param duration - Appointment duration in minutes
 * @returns True if there is a conflict
 */
export async function hasConflict(
  doctorId: string,
  startTime: Date,
  duration: number
): Promise<boolean> {
  // Implementation
}
```

### Documentation Files
- Keep README.md up to date with setup instructions
- Document environment variables in `.env.sample`
- Add feature documentation in feature directories if needed
- Don't create docs for trivial/self-explanatory features

## Code Quality

### Functions
- Keep functions small and focused (single responsibility)
- Max 50 lines per function (guideline, not hard rule)
- Early returns for guard clauses
- Avoid deep nesting (max 3 levels)

```typescript
// ✅ Good — early return
function getSlotStatus(slot: TimeSlot): string {
  if (!slot.isAvailable) return 'unavailable';
  if (slot.isBlocked) return 'blocked';
  if (slot.bookingsCount >= slot.maxBookings) return 'full';
  return 'available';
}

// ❌ Bad — nested conditions
function getSlotStatus(slot: TimeSlot): string {
  if (slot.isAvailable) {
    if (!slot.isBlocked) {
      if (slot.bookingsCount < slot.maxBookings) {
        return 'available';
      } else {
        return 'full';
      }
    } else {
      return 'blocked';
    }
  } else {
    return 'unavailable';
  }
}
```

### Components
- One component per file
- Keep components under 200 lines
- Extract complex logic into hooks
- Destructure props in function signature

```typescript
// ✅ Good
export function AppointmentCard({ doctor, dateTime, status }: AppointmentCardProps) {
  return <div>...</div>;
}

// ❌ Bad
export function AppointmentCard(props: AppointmentCardProps) {
  return <div>{props.doctor}</div>;
}
```

### Imports
- Follow the 5-tier import order (below)
- Use absolute imports with `@/` alias for `src/` files
- Use relative imports only within the same feature
- No unused imports (enforced by ESLint)
- Separate groups with blank lines

**Standard Import Order:**
```typescript
// 1. External dependencies
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { format } from 'date-fns';

// 2. Internal absolute imports
import { Button } from '@/components/ui/button';
import { useAppointments } from '@/features/appointments';
import { cn } from '@/lib/utils';

// 3. Relative imports (same feature/directory)
import { TimeSlotPicker } from './time-slot-picker';
import { DoctorSelector } from './doctor-selector';

// 4. Type imports
import type { Appointment } from '@/features/appointments';
import type { FormProps } from './types';

// 5. Styles (if any)
import './styles.css';
```

## Best Practices

### DRY (Don't Repeat Yourself)
- Extract repeated logic into utilities or hooks
- Use shared components for repeated UI patterns
- Don't duplicate validation schemas

### YAGNI (You Aren't Gonna Need It)
- Don't build features or abstractions before they're needed
- Start simple, refactor when complexity is justified
- Prefer concrete code over premature abstractions

### Error Handling
- Use try-catch for async operations
- Provide user-friendly error messages
- Log errors with context for debugging

### Performance
- Memoize expensive calculations with `useMemo`
- Memoize callbacks passed to children with `useCallback`
- Use React Server Components by default
- Only use Client Components when needed

## SOLID Principles

### Single Responsibility Principle (SRP)
Each module, class, function, or component should have one, and only one, reason to change.

```typescript
// ✅ Good: Single responsibility
export function formatAppointmentTime(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

// ❌ Bad: Multiple responsibilities
export function processAppointment(data: AppointmentInput) {
  const formatted = formatAppointmentTime(data.dateTime);
  const saved = saveToDatabase(data);
  sendReminderEmail(data.patientEmail);
  updateDoctorSchedule(data.doctorId);
}
```

### Open/Closed Principle (OCP)
Software entities should be open for extension but closed for modification.

### Liskov Substitution Principle (LSP)
Subtypes should be substitutable for their base types.

### Interface Segregation Principle (ISP)
Clients should not be forced to depend on interfaces they do not use.

```typescript
// ✅ Good: Segregated interfaces
type Patient = {
  id: string;
  email: string;
  name: string;
};

type Doctor = {
  id: string;
  email: string;
  specialization: string;
  licenseNumber: string;
};
```

### Dependency Inversion Principle (DIP)
High-level modules should not depend on low-level modules; both should depend on abstractions.

## General Development Standards

- Always review existing code patterns before adding new functionality
- Avoid deeply nested logic and overly long functions
- No unnecessary comments and `console.log` in committed code
- Prefer TypeScript strict mode; avoid `any` types
- Handle asynchronous tasks with proper `async`/`await` and error handling
- Keep cyclomatic complexity low (< 10 per function)
- Maintain test coverage above configured thresholds
