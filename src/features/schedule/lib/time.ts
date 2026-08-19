/** Read HH:mm from a Prisma `@db.Time` value stored on the 1970-01-01 epoch. */
export function dbTimeToHm(time: Date): string {
  const hours = time.getUTCHours();
  const minutes = time.getUTCMinutes();
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Store HH:mm as a Prisma-compatible `@db.Time` Date. */
export function hmToDbTime(hm: string): Date {
  const [hours, minutes] = hm.split(":").map(Number);
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0, 0));
}

const HM_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidHm(value: string): boolean {
  return HM_PATTERN.test(value);
}

/** Returns true when end is strictly after start on the same calendar day. */
export function isValidTimeRange(startTime: string, endTime: string): boolean {
  if (!isValidHm(startTime) || !isValidHm(endTime)) return false;
  return hmToDbTime(endTime).getTime() > hmToDbTime(startTime).getTime();
}
