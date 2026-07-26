/**
 * Clinic wall-clock timezone for appointment slots.
 * Booking stores instants that represent this zone's local time; UI must
 * format back into the same zone so detail pages match the chosen slot.
 */
export const CLINIC_TIMEZONE =
  process.env.NEXT_PUBLIC_CLINIC_TIMEZONE ?? "Asia/Kolkata";
