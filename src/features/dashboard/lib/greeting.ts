/**
 * Time-of-day greeting for the patient dashboard header.
 */
export function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Whole days from `from` until `target` (floored). Negative when past.
 */
export function daysUntil(target: Date, from: Date = new Date()): number {
  const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const end = Date.UTC(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );
  return Math.floor((end - start) / (24 * 60 * 60 * 1000));
}

export function formatCountdownLabel(days: number): string {
  if (days <= 0) return 'Today';
  if (days === 1) return '1 Day';
  return `${days} Days`;
}
