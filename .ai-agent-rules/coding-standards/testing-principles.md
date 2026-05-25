# Testing Principles

## Testing Framework
- **Framework**: Vitest 4
- **React Testing**: React Testing Library (`@testing-library/react`)
- **Environment**: jsdom
- **Coverage**: V8 provider (`@vitest/coverage-v8`)
- **Thresholds**: 90% lines, 90% branches
- **Reports**: JUnit XML → `./build/junit-report.xml`
- **E2E Testing**: Playwright (when needed)

## Testing Strategy

### Test Pyramid
1. **Unit Tests** (Most) — Fast, isolated, focused
2. **Integration Tests** (Moderate) — Feature workflows
3. **E2E Tests** (Few) — Critical user journeys

### What to Test
✅ **Always Test:**
- Business logic (appointment conflict detection, scheduling algorithms)
- Data transformations and utilities
- Custom hooks with complex logic
- API endpoints and Server Actions
- Form validation logic
- Error handling and edge cases

✅ **Sometimes Test:**
- Components with complex conditional rendering
- Integration between services and hooks
- Database queries with complex logic

❌ **Don't Test:**
- Implementation details (internal state, private methods)
- Third-party libraries (React, Next.js, Prisma)
- Simple presentational components
- Trivial utilities (one-liners)
- Type definitions

## Test Organization

### File Location
Tests live in the `__tests__/` directory, mirroring the `src/` structure:

```
__tests__/
├── app/
│   └── layout.test.tsx
├── features/
│   ├── appointments/
│   │   ├── components/
│   │   │   └── booking-form.test.tsx
│   │   ├── hooks/
│   │   │   └── use-appointments.test.ts
│   │   └── services/
│   │       └── actions.test.ts
│   └── doctors/
│       └── services/
│           └── queries.test.ts
└── lib/
    └── utils.test.ts
```

### Naming Convention
- Test files: `*.test.ts` or `*.test.tsx`
- Test suites: `describe('ComponentName', () => {})`
- Test cases: `it('should do something', () => {})`

## Testing Patterns

### Testing React Components
```typescript
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BookingForm } from '@/features/appointments';

describe('BookingForm', () => {
  it('should render doctor and time slot fields', () => {
    render(<BookingForm />);
    expect(screen.getByLabelText(/doctor/i)).toBeDefined();
    expect(screen.getByLabelText(/time/i)).toBeDefined();
  });
});
```

### Testing Custom Hooks
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAppointments } from '@/features/appointments';

describe('useAppointments', () => {
  it('should return appointments for a patient', async () => {
    const { result } = renderHook(() => useAppointments('patient-1'));
    await waitFor(() => {
      expect(result.current.appointments).toBeDefined();
    });
  });
});
```

### Testing Server Actions
```typescript
import { describe, expect, it } from 'vitest';
import { bookAppointmentAction } from '@/features/appointments';

describe('bookAppointmentAction', () => {
  it('should create a new appointment', async () => {
    const data = { doctorId: 'doc-1', dateTime: new Date(), patientId: 'pat-1' };
    const result = await bookAppointmentAction(data);
    expect(result.success).toBe(true);
  });
});
```

### Testing Services / Business Logic
```typescript
import { describe, expect, it } from 'vitest';
import { hasSchedulingConflict } from '@/features/appointments';

describe('hasSchedulingConflict', () => {
  it('should detect overlapping appointments', () => {
    const existing = { start: new Date('2026-06-01T10:00'), end: new Date('2026-06-01T10:30') };
    const proposed = { start: new Date('2026-06-01T10:15'), end: new Date('2026-06-01T10:45') };
    expect(hasSchedulingConflict(existing, proposed)).toBe(true);
  });

  it('should allow back-to-back appointments', () => {
    const existing = { start: new Date('2026-06-01T10:00'), end: new Date('2026-06-01T10:30') };
    const proposed = { start: new Date('2026-06-01T10:30'), end: new Date('2026-06-01T11:00') };
    expect(hasSchedulingConflict(existing, proposed)).toBe(false);
  });
});
```

## Best Practices

### General
- Write tests before or immediately after code
- One assertion per test when possible
- Use descriptive test names that explain the behavior
- Follow AAA pattern: Arrange, Act, Assert
- Keep tests simple and readable
- Mock external dependencies (APIs, databases)

### React Testing Library
- Query by accessibility roles and labels (not test IDs)
- Test user behavior, not implementation
- Use `userEvent` for realistic user interactions
- Avoid testing internal state

### Mocking
- Mock at the boundary (API calls, database)
- Use Vitest mocks: `vi.mock('@/lib/prisma')`
- Create mock factories for common test data
- Reset mocks between tests: `beforeEach(() => vi.clearAllMocks())`

### Async Testing
- Always `await` async operations
- Use `waitFor` for async state updates
- Handle loading and error states
- Don't use arbitrary timeouts

## Test Coverage

### Target Coverage
- Configured thresholds: **90% lines, 90% branches** (in `vitest.config.mts`)
- Focus on critical paths and complex logic
- Not a goal: 100% coverage for trivial code

### Coverage Exclusions
- Configuration files
- Type definitions
- Simple UI components with no logic
- Generated code (Prisma types)

## Performance

### Keep Tests Fast
- Use `vi.mock()` to mock slow dependencies
- Avoid real database calls in unit tests
- Use test database for integration tests
- Vitest runs tests in parallel by default

### Test Isolation
- Each test should be independent
- Clean up after tests (database, mocks, state)
- Use `beforeEach` and `afterEach` for setup/teardown
- Don't rely on test execution order

## Common Pitfalls

❌ **Avoid:**
- Testing implementation details
- Brittle selectors (CSS classes, test IDs when not needed)
- Large, complex test files
- Shared mutable state between tests
- Over-mocking (mock only what's necessary)
- Testing the framework itself

✅ **Prefer:**
- Testing user-facing behavior
- Semantic queries (role, label, text)
- Small, focused test files
- Isolated, independent tests
- Minimal, boundary-level mocking
- Testing your code, not libraries
