import { describe, expect, it } from 'vitest';

import {
  appointmentDetailsSchema,
  createAppointmentSchema,
  slotsQuerySchema,
} from '@/features/appointments/types/schemas';

describe('appointmentDetailsSchema', () => {
  it('requires reason for visit', () => {
    const result = appointmentDetailsSchema.safeParse({
      reasonForVisit: '',
      additionalNotes: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid reason and optional notes', () => {
    const result = appointmentDetailsSchema.safeParse({
      reasonForVisit: 'Annual checkup',
      additionalNotes: 'Bring prior reports',
    });
    expect(result.success).toBe(true);
  });

  it('rejects reason longer than 200 characters', () => {
    const result = appointmentDetailsSchema.safeParse({
      reasonForVisit: 'x'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('rejects notes longer than 500 characters', () => {
    const result = appointmentDetailsSchema.safeParse({
      reasonForVisit: 'Checkup',
      additionalNotes: 'y'.repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe('createAppointmentSchema', () => {
  const valid = {
    doctorId: '11111111-1111-4111-8111-111111111111',
    date: '2026-07-27',
    startTime: '14:00',
    reasonForVisit: 'Follow-up',
  };

  it('accepts a valid payload', () => {
    expect(createAppointmentSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid date format', () => {
    expect(
      createAppointmentSchema.safeParse({ ...valid, date: '27-07-2026' })
        .success,
    ).toBe(false);
  });

  it('rejects invalid time format', () => {
    expect(
      createAppointmentSchema.safeParse({ ...valid, startTime: '2pm' }).success,
    ).toBe(false);
  });
});

describe('slotsQuerySchema', () => {
  it('accepts YYYY-MM-DD', () => {
    expect(slotsQuerySchema.safeParse({ date: '2026-07-28' }).success).toBe(
      true,
    );
  });

  it('rejects impossible calendar dates', () => {
    expect(slotsQuerySchema.safeParse({ date: '2026-02-30' }).success).toBe(
      false,
    );
  });
});
