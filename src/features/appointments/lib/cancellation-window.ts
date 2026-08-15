import { DEFAULT_CANCELLATION_CUTOFF_HOURS } from "../constants";

const MS_PER_HOUR = 3_600_000;

/**
 * Cut-off window shared by cancellation and rescheduling, in hours.
 * Falls back to the default when the environment variable is unset or not a
 * usable non-negative number, so a typo never disables the rule silently.
 */
export function getCancellationCutoffHours(): number {
  const raw = process.env.APPOINTMENT_CANCELLATION_CUTOFF_HOURS;
  if (!raw) return DEFAULT_CANCELLATION_CUTOFF_HOURS;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return DEFAULT_CANCELLATION_CUTOFF_HOURS;
  }
  return parsed;
}

/**
 * True once an appointment is too close to its start time to be changed.
 * Also covers appointments that have already started or passed.
 *
 * @param startsAt - Appointment start instant
 * @param cutoffHours - Window during which changes are refused
 * @param now - Current instant (injectable for tests)
 */
export function hasCancellationCutoffPassed(
  startsAt: Date,
  cutoffHours: number,
  now: Date = new Date(),
): boolean {
  return startsAt.getTime() - now.getTime() < cutoffHours * MS_PER_HOUR;
}

/** User-facing explanation for a refused cancellation or reschedule. */
export function buildCutoffMessage(cutoffHours: number): string {
  const window = cutoffHours === 1 ? "1 hour" : `${cutoffHours} hours`;
  return `Appointments can only be changed more than ${window} before the scheduled time. Please contact the clinic.`;
}
