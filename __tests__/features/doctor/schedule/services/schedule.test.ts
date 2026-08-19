import { beforeEach, describe, expect, it, vi } from "vitest";
import { DateTime } from "luxon";

import { CLINIC_TIMEZONE } from "@/features/appointments/lib/timezone";
import { defaultWeeklyHours } from "@/features/doctor/schedule/lib/defaults";
import { sessionsToDbTimes } from "@/features/doctor/schedule/types/schemas";
import {
  createDoctorScheduleBlock,
  deleteDoctorScheduleBlock,
  getDoctorSchedule,
  updateDoctorSchedule,
} from "@/features/doctor/schedule/services/schedule";
import { AppError } from "@/lib/errors";

const mockDoctorFindUnique = vi.fn();
const mockDoctorFindUniqueOrThrow = vi.fn();
const mockAppointmentFindMany = vi.fn();
const mockAppointmentUpdateMany = vi.fn();
const mockAppointmentHistoryCreateMany = vi.fn();
const mockScheduleBlockCreate = vi.fn();
const mockScheduleBlockFindMany = vi.fn();
const mockScheduleBlockFindFirst = vi.fn();
const mockScheduleBlockDelete = vi.fn();
const mockSlotConfigurationFindMany = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    doctor: {
      findUnique: (...args: unknown[]) => mockDoctorFindUnique(...args),
      findUniqueOrThrow: (...args: unknown[]) =>
        mockDoctorFindUniqueOrThrow(...args),
    },
    appointment: {
      findMany: (...args: unknown[]) => mockAppointmentFindMany(...args),
    },
    scheduleBlock: {
      create: (...args: unknown[]) => mockScheduleBlockCreate(...args),
      findMany: (...args: unknown[]) => mockScheduleBlockFindMany(...args),
      findFirst: (...args: unknown[]) => mockScheduleBlockFindFirst(...args),
      delete: (...args: unknown[]) => mockScheduleBlockDelete(...args),
    },
    slotConfiguration: {
      findMany: (...args: unknown[]) => mockSlotConfigurationFindMany(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

const mockScheduleNotifications = vi.fn();
vi.mock("@/features/notifications/services/dispatch", () => ({
  scheduleAppointmentNotifications: (...args: unknown[]) =>
    mockScheduleNotifications(...args),
}));

const weeklyHours = defaultWeeklyHours();

describe("doctor schedule service", () => {
  const futureFrom = DateTime.now()
    .setZone(CLINIC_TIMEZONE)
    .plus({ days: 10 })
    .toFormat("yyyy-MM-dd");
  const futureTo = DateTime.now()
    .setZone(CLINIC_TIMEZONE)
    .plus({ days: 12 })
    .toFormat("yyyy-MM-dd");

  const blockResult = {
    id: "block-1",
    startsAt: DateTime.fromISO(futureFrom, { zone: CLINIC_TIMEZONE })
      .startOf("day")
      .toJSDate(),
    endsAt: DateTime.fromISO(futureTo, { zone: CLINIC_TIMEZONE })
      .endOf("day")
      .toJSDate(),
    reason: "Holiday",
    blockType: "TIME_OFF",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDoctorFindUnique.mockResolvedValue({ id: "doc-1" });
    mockDoctorFindUniqueOrThrow.mockResolvedValue({
      acceptingNewPatients: true,
      bufferMinutes: 15,
      slotDurationMinutes: 60,
    });
    mockAppointmentFindMany.mockResolvedValue([]);
    mockSlotConfigurationFindMany.mockResolvedValue([]);
    mockScheduleBlockFindMany.mockResolvedValue([]);
    mockScheduleBlockCreate.mockResolvedValue(blockResult);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        doctor: { update: vi.fn() },
        appointment: {
          updateMany: (...a: unknown[]) => mockAppointmentUpdateMany(...a),
        },
        appointmentHistory: {
          createMany: (...a: unknown[]) =>
            mockAppointmentHistoryCreateMany(...a),
        },
        scheduleBlock: {
          create: (...a: unknown[]) => mockScheduleBlockCreate(...a),
        },
        slotConfiguration: {
          deleteMany: vi.fn(),
          create: vi.fn(),
        },
      }),
    );
  });

  it("rejects unauthenticated access", async () => {
    await expect(getDoctorSchedule("user-1", undefined)).rejects.toThrow(
      /Unauthorized/,
    );
  });

  it("rejects a missing doctor profile", async () => {
    mockDoctorFindUnique.mockResolvedValue(null);
    await expect(getDoctorSchedule("user-1", "doctor")).rejects.toThrow(
      /Doctor profile not found/,
    );
  });

  it("returns weekly hours and blocks", async () => {
    mockSlotConfigurationFindMany.mockResolvedValue([
      {
        dayOfWeek: 1,
        startTime: new Date("1970-01-01T09:00:00.000Z"),
        endTime: new Date("1970-01-01T17:00:00.000Z"),
        label: "Clinic",
      },
    ]);
    mockScheduleBlockFindMany.mockResolvedValue([
      {
        id: "block-1",
        startsAt: new Date("2026-08-25T00:00:00.000Z"),
        endsAt: new Date("2026-08-26T23:59:59.000Z"),
        reason: "Holiday",
        blockType: "TIME_OFF",
      },
    ]);

    const result = await getDoctorSchedule("user-1", "doctor");
    expect(result.settings.acceptingNewPatients).toBe(true);
    expect(result.weeklyHours[1]?.enabled).toBe(true);
    expect(result.weeklyHours[0]?.enabled).toBe(false);
    expect(result.blocks).toHaveLength(1);
  });

  it("saves closed days by skipping disabled weekdays", async () => {
    await updateDoctorSchedule("user-1", "doctor", {
      acceptingNewPatients: false,
      bufferMinutes: 15,
      slotDurationMinutes: 45,
      weeklyHours,
    });

    expect(mockTransaction).toHaveBeenCalled();
  });

  it("rejects an enabled day without sessions", async () => {
    const invalid = weeklyHours.map((day) =>
      day.dayOfWeek === 1 ? { ...day, enabled: true, sessions: [] } : day,
    );

    await expect(
      updateDoctorSchedule("user-1", "doctor", {
        acceptingNewPatients: true,
        bufferMinutes: 15,
        slotDurationMinutes: 60,
        weeklyHours: invalid,
      }),
    ).rejects.toThrow(/Add at least one session/);
  });

  it("rejects past start dates", async () => {
    await expect(
      createDoctorScheduleBlock("user-1", "doctor", {
        dateFrom: "2020-01-01",
        dateTo: "2020-01-02",
        reason: "Holiday",
      }),
    ).rejects.toThrow(AppError);
  });

  it("rejects invalid closed-date payloads", async () => {
    await expect(
      createDoctorScheduleBlock("user-1", "doctor", {
        dateFrom: "not-a-date",
        dateTo: futureTo,
        reason: "Holiday",
      }),
    ).rejects.toThrow(/YYYY-MM-DD|Invalid/);
  });

  it("auto-cancels confirmed appointments when adding closed days", async () => {
    const apt1Start = new Date("2026-09-01T10:00:00.000Z");
    const apt1End = new Date("2026-09-01T11:00:00.000Z");
    const apt2Start = new Date("2026-09-02T14:00:00.000Z");
    const apt2End = new Date("2026-09-02T15:00:00.000Z");

    mockAppointmentFindMany.mockResolvedValue([
      { id: "apt-1", startsAt: apt1Start, endsAt: apt1End },
      { id: "apt-2", startsAt: apt2Start, endsAt: apt2End },
    ]);

    const result = await createDoctorScheduleBlock("user-1", "doctor", {
      dateFrom: futureFrom,
      dateTo: futureTo,
      reason: "Holiday",
    });

    expect(mockAppointmentUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ["apt-1", "apt-2"] } },
        data: expect.objectContaining({
          status: "CANCELLED",
        }),
      }),
    );

    expect(mockAppointmentHistoryCreateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({
            appointmentId: "apt-1",
            event: "CANCELLED",
            changedByRole: "doctor",
          }),
          expect.objectContaining({
            appointmentId: "apt-2",
            event: "CANCELLED",
            changedByRole: "doctor",
          }),
        ]),
      }),
    );

    expect(mockScheduleNotifications).toHaveBeenCalledTimes(2);
    expect(mockScheduleNotifications).toHaveBeenCalledWith(
      "appointment.cancelled",
      "apt-1",
      { cancelledBy: "doctor" },
    );
    expect(mockScheduleNotifications).toHaveBeenCalledWith(
      "appointment.cancelled",
      "apt-2",
      { cancelledBy: "doctor" },
    );

    expect(result.cancelledAppointments).toBe(2);
    expect(result.id).toBe("block-1");
  });

  it("creates a time-off block with no conflicting appointments", async () => {
    const result = await createDoctorScheduleBlock("user-1", "doctor", {
      dateFrom: futureFrom,
      dateTo: futureTo,
      reason: "Festival holiday",
    });

    expect(mockScheduleBlockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          doctorId: "doc-1",
          reason: "Festival holiday",
          blockType: "TIME_OFF",
        }),
      }),
    );
    expect(mockAppointmentUpdateMany).not.toHaveBeenCalled();
    expect(mockScheduleNotifications).not.toHaveBeenCalled();
    expect(result.id).toBe("block-1");
    expect(result.cancelledAppointments).toBe(0);
  });

  it("maps session times for persistence", () => {
    expect(
      sessionsToDbTimes([
        { startTime: "09:00", endTime: "17:00", label: "Clinic" },
      ])[0]?.label,
    ).toBe("Clinic");
  });

  it("deletes a doctor's own block", async () => {
    mockScheduleBlockFindFirst.mockResolvedValue({ id: "block-1" });
    await deleteDoctorScheduleBlock("user-1", "doctor", "block-1");
    expect(mockScheduleBlockDelete).toHaveBeenCalledWith({
      where: { id: "block-1" },
    });
  });

  it("does not delete another doctor's block", async () => {
    mockScheduleBlockFindFirst.mockResolvedValue(null);
    await expect(
      deleteDoctorScheduleBlock("user-1", "doctor", "block-missing"),
    ).rejects.toThrow(/not found/);
  });
});
