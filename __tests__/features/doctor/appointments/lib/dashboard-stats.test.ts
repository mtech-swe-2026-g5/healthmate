import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";

import {
  buildTodaySchedule,
  buildUpcomingWeekList,
  computeDoctorDashboardStats,
  formatClinicTime,
  formatHeaderDate,
  initialDoctorWeekRange,
} from "@/features/doctor/appointments/lib/dashboard-stats";
import type { Appointment } from "@/features/doctor/appointments/types/response";

const baseAppointment: Appointment = {
  id: "apt-1",
  patient: {
    id: "pat-1",
    firstName: "Jane",
    lastName: "Doe",
    age: 30,
    gender: "female",
    phoneNumber: "+1234567890",
    bloodGroup: "O+",
  },
  start: new Date("2026-08-18T04:30:00.000Z"),
  end: new Date("2026-08-18T05:30:00.000Z"),
};

describe("doctor dashboard stats", () => {
  const now = DateTime.fromISO("2026-08-18T03:00:00.000Z", {
    zone: "Asia/Kolkata",
  });

  it("counts today's and weekly appointments", () => {
    const appointments = [
      baseAppointment,
      {
        ...baseAppointment,
        id: "apt-2",
        start: new Date("2026-08-19T04:30:00.000Z"),
        end: new Date("2026-08-19T05:30:00.000Z"),
      },
    ];

    const stats = computeDoctorDashboardStats(appointments, now);

    expect(stats.todayCount).toBe(1);
    expect(stats.weekTotal).toBe(2);
    expect(stats.upcomingToday).toBe(1);
  });

  it("builds today's timeline in clinic timezone", () => {
    const schedule = buildTodaySchedule([baseAppointment], now);

    expect(schedule).toHaveLength(1);
    expect(schedule[0]?.patientName).toBe("Jane Doe");
    expect(schedule[0]?.durationMinutes).toBe(60);
    expect(schedule[0]?.isCurrent).toBe(false);
    expect(schedule[0]?.isPast).toBe(false);
  });

  it("builds upcoming week entries and formatting helpers", () => {
    const upcoming = buildUpcomingWeekList([baseAppointment], now);
    expect(upcoming[0]?.label).toBe("Jane Doe");
    expect(formatClinicTime(baseAppointment.start)).toMatch(/\d/);
    expect(formatHeaderDate(now.toJSDate())).toMatch(/Aug 18 · IST/);
    expect(
      DateTime.fromJSDate(initialDoctorWeekRange().start).setZone("Asia/Kolkata")
        .weekday % 7,
    ).toBe(0);
  });

  it("still counts appointments when API dates arrive as ISO strings", () => {
    const appointments = [
      {
        ...baseAppointment,
        start: "2026-08-18T04:30:00.000Z" as unknown as Date,
        end: "2026-08-18T05:30:00.000Z" as unknown as Date,
      },
    ];

    const stats = computeDoctorDashboardStats(appointments, now);
    expect(stats.todayCount).toBe(1);
    expect(buildTodaySchedule(appointments, now)).toHaveLength(1);
    expect(buildUpcomingWeekList(appointments, now)).toHaveLength(1);
  });
});
