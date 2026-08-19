import { DateTime } from "luxon";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildSlotStarts,
  generateSlots,
} from "@/features/appointments/services/slots";
import { CLINIC_TIMEZONE } from "@/features/appointments/lib/timezone";

const mockDoctorFindFirst = vi.fn();
const mockWorkingHoursFindUnique = vi.fn();
const mockSlotConfigurationFindMany = vi.fn();
const mockSlotConfigurationFindFirst = vi.fn();
const mockScheduleBlockFindMany = vi.fn();
const mockAppointmentFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    doctor: { findFirst: (...args: unknown[]) => mockDoctorFindFirst(...args) },
    workingHours: {
      findUnique: (...args: unknown[]) => mockWorkingHoursFindUnique(...args),
    },
    slotConfiguration: {
      findMany: (...args: unknown[]) => mockSlotConfigurationFindMany(...args),
      findFirst: (...args: unknown[]) => mockSlotConfigurationFindFirst(...args),
    },
    scheduleBlock: {
      findMany: (...args: unknown[]) => mockScheduleBlockFindMany(...args),
    },
    appointment: {
      findMany: (...args: unknown[]) => mockAppointmentFindMany(...args),
    },
  },
}));

function clinicDate(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
): Date {
  return DateTime.fromObject(
    { year, month, day, hour, minute, second: 0, millisecond: 0 },
    { zone: CLINIC_TIMEZONE },
  ).toJSDate();
}

const doctorSchedule = {
  slotDurationMinutes: 60,
  bufferMinutes: 0,
  acceptingNewPatients: true,
};

const mondayConfig = {
  doctorId: "doc-1",
  dayOfWeek: 1,
  startTime: new Date("1970-01-01T11:00:00.000Z"),
  endTime: new Date("1970-01-01T19:00:00.000Z"),
  timezone: "Asia/Kolkata",
  validFrom: new Date("2026-01-01T00:00:00.000Z"),
  validUntil: null,
  active: true,
  label: null,
};

describe("buildSlotStarts", () => {
  it("builds 1-hour slots from 11:00 to 19:00", () => {
    expect(buildSlotStarts("11:00", "19:00", 60)).toEqual([
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
    ]);
  });

  it("steps by duration plus buffer while keeping session length", () => {
    expect(buildSlotStarts("11:00", "15:00", 45, 60)).toEqual([
      "11:00",
      "12:00",
      "13:00",
      "14:00",
    ]);
  });
});

describe("generateSlots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoctorFindFirst.mockResolvedValue(doctorSchedule);
    mockSlotConfigurationFindMany.mockResolvedValue([mondayConfig]);
    mockSlotConfigurationFindFirst.mockResolvedValue(mondayConfig);
    mockScheduleBlockFindMany.mockResolvedValue([]);
    mockAppointmentFindMany.mockResolvedValue([]);
    mockWorkingHoursFindUnique.mockResolvedValue(null);
  });

  it("rejects Sunday when doctor has no availability", async () => {
    mockSlotConfigurationFindMany.mockResolvedValue([]);

    await expect(
      generateSlots("doc-1", "2026-07-26", clinicDate(2026, 7, 20, 9, 0)),
    ).rejects.toThrow(/working hours/i);
  });

  it("marks booked slots", async () => {
    mockAppointmentFindMany.mockResolvedValue([
      { startsAt: clinicDate(2026, 7, 27, 14, 0), endsAt: clinicDate(2026, 7, 27, 15, 0) },
    ]);

    const slots = await generateSlots(
      "doc-1",
      "2026-07-27",
      clinicDate(2026, 7, 20, 9, 0),
    );

    const fourteen = slots.find((s) => s.startTime === "14:00");
    expect(fourteen?.status).toBe("booked");
    expect(slots.find((s) => s.startTime === "15:00")?.status).toBe(
      "available",
    );
    expect(slots.find((s) => s.startTime === "16:00")?.status).toBe(
      "available",
    );
  });

  it("marks slots blocked by schedule blocks as unavailable", async () => {
    mockScheduleBlockFindMany.mockResolvedValue([
      {
        startsAt: clinicDate(2026, 7, 27, 15, 0),
        endsAt: clinicDate(2026, 7, 27, 16, 0),
      },
    ]);

    const slots = await generateSlots(
      "doc-1",
      "2026-07-27",
      clinicDate(2026, 7, 20, 9, 0),
    );

    expect(slots.find((s) => s.startTime === "15:00")?.status).toBe(
      "unavailable",
    );
  });

  it("marks past times on today as unavailable", async () => {
    const now = clinicDate(2026, 7, 27, 15, 30);
    const slots = await generateSlots("doc-1", "2026-07-27", now);

    expect(slots.find((s) => s.startTime === "11:00")?.status).toBe(
      "unavailable",
    );
    expect(slots.find((s) => s.startTime === "16:00")?.status).toBe(
      "available",
    );
  });

  it("rejects past calendar dates", async () => {
    await expect(
      generateSlots("doc-1", "2026-07-01", clinicDate(2026, 7, 20)),
    ).rejects.toThrow(/past/i);
  });

  it("throws when doctor is not accepting new patients", async () => {
    mockDoctorFindFirst.mockResolvedValue({
      ...doctorSchedule,
      acceptingNewPatients: false,
    });
    await expect(
      generateSlots("doc-1", "2026-07-27", clinicDate(2026, 7, 20)),
    ).rejects.toThrow(/not accepting/i);
  });

  it("throws when doctor is missing", async () => {
    mockDoctorFindFirst.mockResolvedValue(null);
    await expect(
      generateSlots("missing", "2026-07-27", clinicDate(2026, 7, 20)),
    ).rejects.toThrow(/Doctor not found/);
  });

  it("falls back to global working hours when doctor has no slot configs", async () => {
    mockSlotConfigurationFindMany.mockResolvedValue([]);
    mockSlotConfigurationFindFirst.mockResolvedValue(null);
    mockWorkingHoursFindUnique.mockResolvedValue({
      dayOfWeek: 1,
      startTime: "11:00",
      endTime: "19:00",
      slotDurationMinutes: 60,
      isActive: true,
    });

    const slots = await generateSlots(
      "doc-1",
      "2026-07-27",
      clinicDate(2026, 7, 20, 9, 0),
    );

    expect(slots.length).toBeGreaterThan(0);
  });

  it("treats inactive global working hours as closed", async () => {
    mockSlotConfigurationFindMany.mockResolvedValue([]);
    mockSlotConfigurationFindFirst.mockResolvedValue(null);
    mockWorkingHoursFindUnique.mockResolvedValue({
      dayOfWeek: 1,
      startTime: "11:00",
      endTime: "19:00",
      slotDurationMinutes: 60,
      isActive: false,
    });

    await expect(
      generateSlots("doc-1", "2026-07-27", clinicDate(2026, 7, 20, 9, 0)),
    ).rejects.toThrow(/working hours/i);
  });

  it("spaces patient slots by duration plus buffer", async () => {
    mockDoctorFindFirst.mockResolvedValue({
      ...doctorSchedule,
      slotDurationMinutes: 45,
      bufferMinutes: 15,
    });

    const slots = await generateSlots(
      "doc-1",
      "2026-07-27",
      clinicDate(2026, 7, 20, 9, 0),
    );

    expect(slots.map((s) => s.startTime).slice(0, 4)).toEqual([
      "11:00",
      "12:00",
      "13:00",
      "14:00",
    ]);
    expect(slots[0]?.endTime).toBe("11:45");
  });

  it("marks only overlapping generated slots as booked after duration changes", async () => {
    mockDoctorFindFirst.mockResolvedValue({
      ...doctorSchedule,
      slotDurationMinutes: 45,
      bufferMinutes: 15,
    });
    mockAppointmentFindMany.mockResolvedValue([
      {
        startsAt: clinicDate(2026, 7, 27, 11, 0),
        endsAt: clinicDate(2026, 7, 27, 12, 0),
      },
    ]);

    const slots = await generateSlots(
      "doc-1",
      "2026-07-27",
      clinicDate(2026, 7, 20, 9, 0),
    );

    expect(slots.find((s) => s.startTime === "11:00")?.status).toBe("booked");
    expect(slots.find((s) => s.startTime === "12:00")?.status).toBe(
      "available",
    );
    expect(slots.find((s) => s.startTime === "13:00")?.status).toBe(
      "available",
    );
  });
});
