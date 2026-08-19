import { DateTime } from "luxon";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { sendDueAppointmentReminders } from "@/features/notifications/services/reminders";

const mockAppointmentFindMany = vi.fn();
const mockSendAppointmentNotifications = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    appointment: {
      findMany: (...args: unknown[]) => mockAppointmentFindMany(...args),
    },
  },
}));

vi.mock("@/features/notifications/services/dispatch", () => ({
  sendAppointmentNotifications: (...args: unknown[]) =>
    mockSendAppointmentNotifications(...args),
}));

describe("sendDueAppointmentReminders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendAppointmentNotifications.mockResolvedValue({
      deliveries: [
        { audience: "patient", status: "sent", attempts: 1 },
        { audience: "doctor", status: "sent", attempts: 1 },
      ],
    });
  });

  it("dispatches 8am, 60-minute, and 30-minute reminders in separate windows", async () => {
    mockAppointmentFindMany
      .mockResolvedValueOnce([{ id: "today-1" }])
      .mockResolvedValueOnce([{ id: "soon-30" }])
      .mockResolvedValueOnce([{ id: "soon-60" }]);

    const now = DateTime.fromISO("2026-08-19T08:05:00", {
      zone: "Asia/Kolkata",
    });

    const result = await sendDueAppointmentReminders(now);

    expect(mockSendAppointmentNotifications).toHaveBeenNthCalledWith(
      1,
      "appointment.reminder.8am",
      "today-1",
    );
    expect(mockSendAppointmentNotifications).toHaveBeenNthCalledWith(
      2,
      "appointment.reminder.60min",
      "soon-60",
    );
    expect(mockSendAppointmentNotifications).toHaveBeenNthCalledWith(
      3,
      "appointment.reminder.30min",
      "soon-30",
    );

    expect(result.summaries).toEqual([
      {
        event: "appointment.reminder.8am",
        appointmentsConsidered: 1,
        deliveriesAttempted: 2,
      },
      {
        event: "appointment.reminder.60min",
        appointmentsConsidered: 1,
        deliveriesAttempted: 2,
      },
      {
        event: "appointment.reminder.30min",
        appointmentsConsidered: 1,
        deliveriesAttempted: 2,
      },
    ]);
  });

  it("skips the 8am reminder pass before 8am IST", async () => {
    mockAppointmentFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: "soon-60" }]);

    const now = DateTime.fromISO("2026-08-19T07:45:00", {
      zone: "Asia/Kolkata",
    });

    const result = await sendDueAppointmentReminders(now);

    expect(mockAppointmentFindMany).toHaveBeenCalledTimes(2);
    expect(
      result.summaries.find((summary) => summary.event === "appointment.reminder.8am"),
    ).toEqual({
      event: "appointment.reminder.8am",
      appointmentsConsidered: 0,
      deliveriesAttempted: 0,
    });
  });
});
