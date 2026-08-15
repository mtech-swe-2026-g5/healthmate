export const BOOKING_STEPS = [
  { id: "doctor", label: "Search" },
  { id: "slot", label: "Schedule" },
  { id: "details", label: "Details" },
  { id: "payment", label: "Payment" },
  { id: "confirmed", label: "Confirm" },
] as const;

export type BookingStepId = (typeof BOOKING_STEPS)[number]["id"];

export const SLOT_STATUSES = ["available", "booked", "unavailable"] as const;
export type SlotStatus = (typeof SLOT_STATUSES)[number];

/**
 * Hours before an appointment starts after which a patient can no longer cancel
 * or reschedule it. Overridable per environment via
 * `APPOINTMENT_CANCELLATION_CUTOFF_HOURS`.
 */
export const DEFAULT_CANCELLATION_CUTOFF_HOURS = 24;
