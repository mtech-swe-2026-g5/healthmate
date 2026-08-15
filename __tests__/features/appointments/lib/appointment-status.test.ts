import { describe, expect, it } from "vitest";

import {
  excludeCancelled,
  getAppointmentPresentation,
  isCancelled,
} from "@/features/appointments/lib/appointment-status";

const confirmedUpcoming = { status: "CONFIRMED", timing: "upcoming" } as const;
const confirmedPast = { status: "CONFIRMED", timing: "past" } as const;
const cancelledUpcoming = { status: "CANCELLED", timing: "upcoming" } as const;
const cancelledPast = { status: "CANCELLED", timing: "past" } as const;

describe("isCancelled", () => {
  it("detects a cancelled appointment", () => {
    expect(isCancelled(cancelledUpcoming)).toBe(true);
  });

  it("treats a confirmed appointment as live", () => {
    expect(isCancelled(confirmedUpcoming)).toBe(false);
  });
});

describe("getAppointmentPresentation", () => {
  it("labels a future confirmed appointment as upcoming", () => {
    expect(getAppointmentPresentation(confirmedUpcoming).label).toBe(
      "Upcoming",
    );
  });

  it("labels a past confirmed appointment as completed", () => {
    expect(getAppointmentPresentation(confirmedPast).label).toBe("Completed");
  });

  // The regression behind the dashboard bug: a cancelled booking whose slot is
  // still in the future must never read as upcoming or confirmed.
  it("labels a cancelled future appointment as cancelled, not upcoming", () => {
    const presentation = getAppointmentPresentation(cancelledUpcoming);
    expect(presentation.label).toBe("Cancelled");
    expect(presentation.cancelled).toBe(true);
  });

  it("labels a cancelled past appointment as cancelled, not completed", () => {
    expect(getAppointmentPresentation(cancelledPast).label).toBe("Cancelled");
  });

  it("gives cancelled appointments the error styling", () => {
    expect(
      getAppointmentPresentation(cancelledUpcoming).badgeClassName,
    ).toContain("color-error");
  });
});

describe("excludeCancelled", () => {
  it("drops cancelled appointments and keeps the rest in order", () => {
    const list = [
      { id: "a", ...confirmedUpcoming },
      { id: "b", ...cancelledUpcoming },
      { id: "c", ...confirmedPast },
    ];

    expect(excludeCancelled(list).map((a) => a.id)).toEqual(["a", "c"]);
  });

  it("returns an empty list when everything is cancelled", () => {
    expect(excludeCancelled([{ ...cancelledUpcoming }])).toEqual([]);
  });

  it("handles an empty list", () => {
    expect(excludeCancelled([])).toEqual([]);
  });
});
