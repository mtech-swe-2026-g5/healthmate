/**
 * Masks an address so delivery failures can be traced without logging PII.
 * "priya.sharma@clinic.com" → "p***a@clinic.com"
 */
export function maskEmail(email: string): string {
  const atIndex = email.lastIndexOf("@");
  if (atIndex <= 0) return "***";

  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex);

  if (local.length <= 2) return `${local[0]}***${domain}`;

  return `${local[0]}***${local[local.length - 1]}${domain}`;
}
