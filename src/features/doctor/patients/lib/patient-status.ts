export type PatientRosterStatus = "active" | "inactive" | "new";

const ACTIVE_WINDOW_DAYS = 365;

export function derivePatientRosterStatus(input: {
  visitCount: number;
  hasUpcoming: boolean;
  lastVisitAt: Date | null;
  now?: Date;
}): PatientRosterStatus {
  if (input.visitCount <= 1) {
    return "new";
  }

  if (input.hasUpcoming) {
    return "active";
  }

  if (input.lastVisitAt) {
    const now = input.now ?? new Date();
    const elapsedDays =
      (now.getTime() - input.lastVisitAt.getTime()) / (1000 * 60 * 60 * 24);
    if (elapsedDays <= ACTIVE_WINDOW_DAYS) {
      return "active";
    }
  }

  return "inactive";
}

export function formatPatientDisplayId(patientId: string): string {
  const suffix = patientId.replace(/-/g, "").slice(-4).toUpperCase();
  return `#PT-${suffix}`;
}

export function patientInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}
