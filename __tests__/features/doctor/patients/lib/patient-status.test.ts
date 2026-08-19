import { describe, expect, it } from "vitest";

import {
  derivePatientRosterStatus,
  formatPatientDisplayId,
  patientInitials,
} from "@/features/doctor/patients/lib/patient-status";

describe("patient roster status", () => {
  const now = new Date("2026-08-19T12:00:00.000Z");

  it("marks first-time patients as new", () => {
    expect(
      derivePatientRosterStatus({
        visitCount: 1,
        hasUpcoming: false,
        lastVisitAt: new Date("2026-07-01T12:00:00.000Z"),
        now,
      }),
    ).toBe("new");
  });

  it("marks patients with upcoming visits as active", () => {
    expect(
      derivePatientRosterStatus({
        visitCount: 4,
        hasUpcoming: true,
        lastVisitAt: new Date("2026-01-01T12:00:00.000Z"),
        now,
      }),
    ).toBe("active");
  });

  it("marks recent repeat patients as active", () => {
    expect(
      derivePatientRosterStatus({
        visitCount: 3,
        hasUpcoming: false,
        lastVisitAt: new Date("2026-06-01T12:00:00.000Z"),
        now,
      }),
    ).toBe("active");
  });

  it("marks stale repeat patients as inactive", () => {
    expect(
      derivePatientRosterStatus({
        visitCount: 3,
        hasUpcoming: false,
        lastVisitAt: new Date("2024-01-01T12:00:00.000Z"),
        now,
      }),
    ).toBe("inactive");
  });

  it("formats display ids and initials", () => {
    expect(formatPatientDisplayId("550e8400-e29b-41d4-a716-446655440000")).toBe(
      "#PT-0000",
    );
    expect(patientInitials("Jane", "Doe")).toBe("JD");
  });
});
