import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import useAppointments from '@/features/doctor/appointments/hooks/use-appointments';
import type { Appointment } from '@/features/doctor/appointments/types/response';

global.fetch = vi.fn();

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

const doctorId = 'doctor-123';
const startDate = new Date('2026-07-01T00:00:00.000Z');
const endDate = new Date('2026-07-07T23:59:59.999Z');

const mockAppointment: Appointment = {
  id: 'appointment-1',
  patient: {
    id: 'patient-1',
    firstName: 'Jane',
    lastName: 'Smith',
    age: 30,
    gender: 'female',
    phoneNumber: '+919876543210',
    bloodGroup: 'O+',
  },
  start: startDate,
  end: endDate,
};

describe('useAppointments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call fetch with the correct query url', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ appointments: [] }),
    });

    const { result } = renderHook(
      () => useAppointments(doctorId, startDate, endDate),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(global.fetch).toHaveBeenCalledWith(
      `/api/doctor/appointments?doctorId=${doctorId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
    );
  });

  it('should return the appointments from the response', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ appointments: [mockAppointment] }),
    });

    const { result } = renderHook(
      () => useAppointments(doctorId, startDate, endDate),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([mockAppointment]);
  });

  it('should return an empty array when there are no appointments', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ appointments: [] }),
    });

    const { result } = renderHook(
      () => useAppointments(doctorId, startDate, endDate),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it('should be in a loading state before the fetch resolves', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}),
    );

    const { result } = renderHook(
      () => useAppointments(doctorId, startDate, endDate),
      { wrapper: createWrapper() },
    );

    expect(result.current.isLoading).toBe(true);
  });

  it('should surface an error state when the fetch rejects', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Network error'),
    );

    const { result } = renderHook(
      () => useAppointments(doctorId, startDate, endDate),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(new Error('Network error'));
  });

  it('should refetch when doctorId, startDate or endDate change', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ appointments: [mockAppointment] }),
    });

    const { result, rerender } = renderHook(
      ({ id, start, end }) => useAppointments(id, start, end),
      {
        wrapper: createWrapper(),
        initialProps: { id: doctorId, start: startDate, end: endDate },
      },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const nextDoctorId = 'doctor-456';
    rerender({ id: nextDoctorId, start: startDate, end: endDate });

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

    expect(global.fetch).toHaveBeenLastCalledWith(
      `/api/doctor/appointments?doctorId=${nextDoctorId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
    );
  });
});
