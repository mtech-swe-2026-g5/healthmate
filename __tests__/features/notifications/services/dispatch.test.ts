import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

import {
  scheduleAppointmentNotifications,
  sendAppointmentNotifications,
} from "@/features/notifications/services/dispatch";
import type { AppointmentNotificationEvent } from "@/features/notifications";

import { buildNotificationContext } from "../notification.mock";

const mockSendEmail = vi.fn();
const mockGetContext = vi.fn();
const mockRunAfterResponse = vi.fn();
const mockLogCreate = vi.fn();
const mockLogUpdateMany = vi.fn();
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

vi.mock("@/lib/prisma", () => ({
  prisma: {
    appointmentNotificationLog: {
      create: (...args: unknown[]) => mockLogCreate(...args),
      updateMany: (...args: unknown[]) => mockLogUpdateMany(...args),
    },
  },
}));

vi.mock("@/lib/logger", () => ({ logger: mockLogger }));

beforeEach(() => {
  vi.clearAllMocks();
  mockGetContext.mockResolvedValue(buildNotificationContext());
  mockSendEmail.mockResolvedValue({ status: "sent", attempts: 1 });
  mockLogCreate.mockResolvedValue({});
  mockLogUpdateMany.mockResolvedValue({ count: 1 });
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
    expect(mockLogCreate).toHaveBeenCalledTimes(2);
    expect(mockLogUpdateMany).toHaveBeenCalledTimes(2);

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

  it("skips duplicate notifications already claimed in the log", async () => {
    mockLogCreate.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("duplicate", {
        code: "P2002",
        clientVersion: "7.9.0",
      }),
    );

    const result = await sendAppointmentNotifications(
      "appointment.booked",
      "appt-1",
    );

    expect(result.deliveries).toEqual([
      { audience: "patient", status: "skipped", attempts: 0 },
      { audience: "doctor", status: "sent", attempts: 1 },
    ]);
  });

  it("records a failed delivery when the log claim itself fails", async () => {
    mockLogCreate.mockRejectedValueOnce(new Error("db offline"));

    const result = await sendAppointmentNotifications(
      "appointment.booked",
      "appt-1",
    );

    expect(result.deliveries).toEqual([
      { audience: "patient", status: "failed", attempts: 0 },
      { audience: "doctor", status: "sent", attempts: 1 },
    ]);
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Appointment notification log claim failed",
      expect.any(Error),
      expect.objectContaining({ audience: "patient" }),
    );
  });

  it("marks skipped mailer deliveries as failed in the notification log", async () => {
    mockSendEmail.mockResolvedValueOnce({ status: "skipped", attempts: 0 });

    await sendAppointmentNotifications("appointment.booked", "appt-1");

    expect(mockLogUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "FAILED",
          errorMessage: "Email delivery skipped or failed.",
          sentAt: null,
        }),
      }),
    );
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

  it("uses the previous slot in the reschedule dedupe key", async () => {
    const previousStartsAt = new Date("2026-08-01T05:30:00.000Z");
    const previousEndsAt = new Date("2026-08-01T06:30:00.000Z");

    await sendAppointmentNotifications("appointment.rescheduled", "appt-1", {
      previousStartsAt,
      previousEndsAt,
    });

    expect(mockLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          dedupeKey: `${previousStartsAt.toISOString()}->2026-08-03T08:30:00.000Z`,
        }),
      }),
    );
  });

  it("uses date-based dedupe keys for 8am reminders and start-time keys for lead reminders", async () => {
    await sendAppointmentNotifications("appointment.reminder.8am", "appt-1");
    await sendAppointmentNotifications("appointment.reminder.30min", "appt-1");
    await sendAppointmentNotifications("appointment.reminder.60min", "appt-1");

    expect(mockLogCreate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({ dedupeKey: "2026-08-03" }),
      }),
    );
    expect(mockLogCreate).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        data: expect.objectContaining({
          dedupeKey: "2026-08-03T08:30:00.000Z",
        }),
      }),
    );
    expect(mockLogCreate).toHaveBeenNthCalledWith(
      5,
      expect.objectContaining({
        data: expect.objectContaining({
          dedupeKey: "2026-08-03T08:30:00.000Z",
        }),
      }),
    );
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
