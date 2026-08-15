import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useRescheduleAppointment } from "@/features/appointments/hooks/use-reschedule-appointment";

const mockRescheduleRequest = vi.fn();

vi.mock("@/features/appointments/services/client", () => ({
  rescheduleAppointmentRequest: (...args: unknown[]) =>
    mockRescheduleRequest(...args),
}));

const APPOINTMENT_ID = "a1";

describe("useRescheduleAppointment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits the selected date and slot", async () => {
    mockRescheduleRequest.mockResolvedValue({ id: APPOINTMENT_ID });
    const { result } = renderHook(() =>
      useRescheduleAppointment(APPOINTMENT_ID),
    );

    act(() => {
      result.current.selectDate("2027-03-01");
    });
    act(() => {
      result.current.selectSlot("14:00");
    });

    let updated;
    await act(async () => {
      updated = await result.current.submit();
    });

    expect(mockRescheduleRequest).toHaveBeenCalledWith(APPOINTMENT_ID, {
      date: "2027-03-01",
      startTime: "14:00",
    });
    expect(updated).toEqual({ id: APPOINTMENT_ID });
    expect(result.current.error).toBeNull();
  });

  it("clears the chosen slot when the date changes", () => {
    const { result } = renderHook(() =>
      useRescheduleAppointment(APPOINTMENT_ID),
    );

    act(() => {
      result.current.selectDate("2027-03-01");
    });
    act(() => {
      result.current.selectSlot("14:00");
    });
    act(() => {
      result.current.selectDate("2027-03-02");
    });

    expect(result.current.date).toBe("2027-03-02");
    expect(result.current.startTime).toBeNull();
  });

  it("refuses to submit without a full selection", async () => {
    const { result } = renderHook(() =>
      useRescheduleAppointment(APPOINTMENT_ID),
    );

    act(() => {
      result.current.selectDate("2027-03-01");
    });

    let updated;
    await act(async () => {
      updated = await result.current.submit();
    });

    expect(updated).toBeNull();
    expect(mockRescheduleRequest).not.toHaveBeenCalled();
    expect(result.current.error).toBe("Select a new date and time slot first");
  });

  it("surfaces the API message on failure", async () => {
    mockRescheduleRequest.mockRejectedValue(new Error("Slot already booked"));
    const { result } = renderHook(() =>
      useRescheduleAppointment(APPOINTMENT_ID),
    );

    act(() => {
      result.current.selectDate("2027-03-01");
    });
    act(() => {
      result.current.selectSlot("14:00");
    });

    let updated;
    await act(async () => {
      updated = await result.current.submit();
    });

    expect(updated).toBeNull();
    expect(result.current.error).toBe("Slot already booked");
  });

  it("falls back to a generic message for a non-Error rejection", async () => {
    mockRescheduleRequest.mockRejectedValue("boom");
    const { result } = renderHook(() =>
      useRescheduleAppointment(APPOINTMENT_ID),
    );

    act(() => {
      result.current.selectDate("2027-03-01");
    });
    act(() => {
      result.current.selectSlot("14:00");
    });
    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.error).toBe("Failed to reschedule appointment");
  });
});
