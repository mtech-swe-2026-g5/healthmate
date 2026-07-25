/**
 * Server-side consultation fee in INR (never trust the client for amount).
 */
export function getConsultationFeeInr(): number {
  const raw = process.env.CONSULTATION_FEE_INR;
  const parsed = raw ? Number(raw) : 500;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 500;
  }
  return Math.round(parsed);
}

export function inrToPaise(amountInr: number): number {
  return Math.round(amountInr * 100);
}

export function paiseToInr(amountInPaise: number): number {
  return amountInPaise / 100;
}
