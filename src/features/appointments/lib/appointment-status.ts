import type { AppointmentConfirmation } from "../services/client";

/** Minimum an appointment must expose to be presented. */
type PresentableAppointment = Pick<
  AppointmentConfirmation,
  "status" | "timing"
>;

export const CANCELLED_STATUS = "CANCELLED";

export function isCancelled(
  appointment: Pick<AppointmentConfirmation, "status">,
): boolean {
  return appointment.status === CANCELLED_STATUS;
}

export type AppointmentPresentation = {
  label: string;
  /** Tailwind classes for the status pill. */
  badgeClassName: string;
  cancelled: boolean;
};

/**
 * Single source of truth for how an appointment's state reads in the UI.
 * Cancellation outranks timing: a cancelled visit is never "Upcoming", even
 * while its original slot is still in the future.
 */
export function getAppointmentPresentation(
  appointment: PresentableAppointment,
): AppointmentPresentation {
  if (isCancelled(appointment)) {
    return {
      label: "Cancelled",
      badgeClassName:
        "bg-[var(--color-error-container)] text-[var(--color-error)]",
      cancelled: true,
    };
  }

  if (appointment.timing === "upcoming") {
    return {
      label: "Upcoming",
      badgeClassName:
        "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
      cancelled: false,
    };
  }

  return {
    label: "Completed",
    badgeClassName:
      "bg-[var(--color-success-container)] text-[var(--color-success)]",
    cancelled: false,
  };
}

/**
 * Drops cancelled appointments from a list.
 *
 * Cancelled rows are retained for history, so any forward-looking surface — the
 * dashboard's next-visit card, its counters — must filter them out or it will
 * count visits that are not happening.
 */
export function excludeCancelled<
  T extends Pick<AppointmentConfirmation, "status">,
>(appointments: T[]): T[] {
  return appointments.filter((appointment) => !isCancelled(appointment));
}
