import { DateTime } from "luxon";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildSlotStarts,
  generateSlots,
} from "@/features/appointments/services/slots";
import { CLINIC_TIMEZONE } from "@/features/appointments/lib/timezone";

const mockDoctorFindFirst = vi.fn();
const mockWorkingHoursFindUnique = vi.fn();
const mockAppointmentFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    doctor: { findFirst: (...args: unknown[]) => mockDoctorFindFirst(...args) },
    workingHours: {
      findUnique: (...args: unknown[]) => mockWorkingHoursFindUnique(...args),
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
});

describe("generateSlots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoctorFindFirst.mockResolvedValue({ id: "doc-1" });
    mockWorkingHoursFindUnique.mockResolvedValue({
      dayOfWeek: 1,
      startTime: "11:00",
      endTime: "19:00",
      slotDurationMinutes: 60,
      isActive: true,
    });
    mockAppointmentFindMany.mockResolvedValue([]);
  });

  it("rejects Sunday (inactive working hours)", async () => {
    mockWorkingHoursFindUnique.mockResolvedValue({
      dayOfWeek: 0,
      startTime: "11:00",
      endTime: "19:00",
      slotDurationMinutes: 60,
      isActive: false,
    });

    // 2026-07-26 is a Sunday
    await expect(
      generateSlots("doc-1", "2026-07-26", clinicDate(2026, 7, 20, 9, 0)),
    ).rejects.toThrow(/working hours/i);
  });

  it("marks booked slots", async () => {
    mockAppointmentFindMany.mockResolvedValue([
      { startsAt: clinicDate(2026, 7, 27, 14, 0) },
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
  });

  it("marks past times on today as unavailable", async () => {
    // Monday 2026-07-27 at 15:30 clinic time — morning slots unavailable
    const now = clinicDate(2026, 7, 27, 15, 30);
    const slots = await generateSlots("doc-1", "2026-07-27", now);

    expect(slots.find((s) => s.startTime === "11:00")?.status).toBe(
      "unavailable",
    );
    expect(slots.find((s) => s.startTime === "15:00")?.status).toBe(
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

  it("throws when doctor is missing", async () => {
    mockDoctorFindFirst.mockResolvedValue(null);
    await expect(
      generateSlots("missing", "2026-07-27", clinicDate(2026, 7, 20)),
    ).rejects.toThrow(/Doctor not found/);
  });
});
