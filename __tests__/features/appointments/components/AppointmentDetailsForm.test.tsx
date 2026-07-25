import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, afterEach } from 'vitest';

import { AppointmentDetailsForm } from '@/features/appointments/components/AppointmentDetailsForm';

const doctor = {
  id: 'd1',
  firstName: 'Ananya',
  lastName: 'Patel',
  specialization: 'General Physician',
};

describe('AppointmentDetailsForm', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows inline reason error when provided on proceed', () => {
    render(
      <AppointmentDetailsForm
        doctor={doctor}
        date="2026-07-27"
        startTime="14:00"
        endTime="15:00"
        reasonForVisit=""
        additionalNotes=""
        reasonError="Reason for visit is required"
        submitError={null}
        submitting={false}
        onReasonChange={vi.fn()}
        onNotesChange={vi.fn()}
        onBack={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByRole('alert').textContent).toContain(
      'Reason for visit is required',
    );
  });

  it('calls onBack without clearing parent slot state responsibility', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    render(
      <AppointmentDetailsForm
        doctor={doctor}
        date="2026-07-27"
        startTime="14:00"
        endTime="15:00"
        reasonForVisit="Checkup"
        additionalNotes=""
        reasonError={null}
        submitError={null}
        submitting={false}
        onReasonChange={vi.fn()}
        onNotesChange={vi.fn()}
        onBack={onBack}
        onSubmit={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('shows booking summary with doctor, date, and slot', () => {
    render(
      <AppointmentDetailsForm
        doctor={doctor}
        date="2026-07-27"
        startTime="14:00"
        endTime="15:00"
        reasonForVisit=""
        additionalNotes=""
        reasonError={null}
        submitError={null}
        submitting={false}
        onReasonChange={vi.fn()}
        onNotesChange={vi.fn()}
        onBack={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText(/Ananya/)).toBeDefined();
    expect(screen.getAllByText(/Patel/).length).toBeGreaterThan(0);
    expect(screen.getByText(/2:00 PM/i)).toBeDefined();
  });

  it('invokes change handlers for reason and notes', async () => {
    const user = userEvent.setup();
    const onReasonChange = vi.fn();
    const onNotesChange = vi.fn();
    const onSubmit = vi.fn();

    render(
      <AppointmentDetailsForm
        doctor={doctor}
        date="2026-07-27"
        startTime="14:00"
        endTime="15:00"
        reasonForVisit=""
        additionalNotes=""
        reasonError={null}
        submitError="Slot already booked"
        submitting={false}
        onReasonChange={onReasonChange}
        onNotesChange={onNotesChange}
        onBack={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText(/reason for visit/i), 'Pain');
    await user.type(screen.getByLabelText(/notes for doctor/i), 'Note');
    await user.click(screen.getByRole('button', { name: 'Confirm Booking' }));

    expect(onReasonChange).toHaveBeenCalled();
    expect(onNotesChange).toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('Slot already booked');
  });
});
