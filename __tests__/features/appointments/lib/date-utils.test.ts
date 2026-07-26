import { describe, expect, it } from "vitest";
import { DateTime } from "luxon";

import {
  combineDateAndTime,
  formatAppointmentDate,
  formatAppointmentTime,
  formatHm,
  formatSlotLabel,
} from "@/features/appointments/lib/date-utils";
import { CLINIC_TIMEZONE } from "@/features/appointments/lib/timezone";

describe("clinic timezone date utils", () => {
  it("stores wall-clock clinic time as the correct UTC instant", () => {
    const instant = combineDateAndTime("2026-07-27", "14:00");
    const inClinic = DateTime.fromJSDate(instant, { zone: "utc" }).setZone(
      CLINIC_TIMEZONE,
    );
    expect(inClinic.toFormat("yyyy-MM-dd HH:mm")).toBe("2026-07-27 14:00");
  });

  it("formats stored instants back to the chosen slot labels", () => {
    const iso = combineDateAndTime("2026-07-27", "14:00").toISOString();
    expect(formatAppointmentTime(iso)).toBe("2:00 PM");
    expect(formatAppointmentDate(iso)).toBe("Jul 27, 2026");
    expect(formatHm(combineDateAndTime("2026-07-27", "14:00"))).toBe("14:00");
    expect(formatSlotLabel("14:00")).toBe("2:00 PM");
  });
});
