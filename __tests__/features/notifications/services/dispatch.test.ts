import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  scheduleAppointmentNotifications,
  sendAppointmentNotifications,
} from "@/features/notifications/services/dispatch";
import type { AppointmentNotificationEvent } from "@/features/notifications";

import { buildNotificationContext } from "../notification.mock";

const mockSendEmail = vi.fn();
const mockGetContext = vi.fn();
const mockRunAfterResponse = vi.fn();
const mockLogger = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/features/notifications/lib/mailer", () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

vi.mock("@/features/notifications/services/recipients", () => ({
  getAppointmentNotificationContext: (...args: unknown[]) =>
    mockGetContext(...args),
}));

vi.mock("@/features/notifications/lib/scheduler", () => ({
  runAfterResponse: (task: () => Promise<void>) => mockRunAfterResponse(task),
}));

vi.mock("@/lib/logger", () => ({ logger: mockLogger }));

beforeEach(() => {
  vi.clearAllMocks();
  mockGetContext.mockResolvedValue(buildNotificationContext());
  mockSendEmail.mockResolvedValue({ status: "sent", attempts: 1 });
});

describe("sendAppointmentNotifications", () => {
  it("emails the patient and the doctor for a booking", async () => {
    const result = await sendAppointmentNotifications(
      "appointment.booked",
      "appt-1",
    );

    expect(mockSendEmail).toHaveBeenCalledTimes(2);
    expect(result.deliveries).toEqual([
      { audience: "patient", status: "sent", attempts: 1 },
      { audience: "doctor", status: "sent", attempts: 1 },
    ]);

    const recipients = mockSendEmail.mock.calls.map((call) => call[0].to);
    expect(recipients).toEqual([
      "priya.sharma@example.com",
      "ananya.patel@example.com",
    ]);
  });

  it("tags each delivery with the booking reference for tracing", async () => {
    await sendAppointmentNotifications("appointment.booked", "appt-1");

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        event: "appointment.booked",
        audience: "patient",
        bookingReference: "HM-A1B2C3",
      }),
    );
  });

  it("delivers to the doctor even when the patient email fails", async () => {
    mockSendEmail
      .mockResolvedValueOnce({ status: "failed", attempts: 4 })
      .mockResolvedValueOnce({ status: "sent", attempts: 1 });

    const result = await sendAppointmentNotifications(
      "appointment.booked",
      "appt-1",
    );

    expect(result.deliveries).toEqual([
      { audience: "patient", status: "failed", attempts: 4 },
      { audience: "doctor", status: "sent", attempts: 1 },
    ]);
  });

  it("records a failure when rendering or sending throws", async () => {
    mockSendEmail.mockRejectedValue(new Error("render failed"));

    const result = await sendAppointmentNotifications(
      "appointment.booked",
      "appt-1",
    );

    expect(result.deliveries.every((d) => d.status === "failed")).toBe(true);
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it("is a no-op for an event with no registered templates", async () => {
    const result = await sendAppointmentNotifications(
      "appointment.unknown" as AppointmentNotificationEvent,
      "appt-1",
    );

    expect(result.deliveries).toEqual([]);
    expect(mockGetContext).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("passes event details through to the templates", async () => {
    const details = { cancelledBy: "patient" as const };

    await sendAppointmentNotifications(
      "appointment.cancelled",
      "appt-1",
      details,
    );

    const patientEmail = mockSendEmail.mock.calls[0][0];
    expect(patientEmail.subject).toContain("Appointment cancelled");
    expect(patientEmail.text).toContain("as requested");
  });

  it("skips delivery when the appointment context cannot be resolved", async () => {
    mockGetContext.mockResolvedValue(null);

    const result = await sendAppointmentNotifications(
      "appointment.booked",
      "missing",
    );

    expect(result.deliveries).toEqual([]);
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalled();
  });
});

describe("scheduleAppointmentNotifications", () => {
  it("defers delivery until after the response", async () => {
    scheduleAppointmentNotifications("appointment.booked", "appt-1");

    expect(mockRunAfterResponse).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).not.toHaveBeenCalled();

    await mockRunAfterResponse.mock.calls[0][0]();
    expect(mockSendEmail).toHaveBeenCalledTimes(2);
  });
});
