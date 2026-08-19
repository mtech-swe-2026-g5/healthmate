export type DoctorCalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  variant?: "appointment" | "blocked";
  subtitle?: string;
  /** Full-day clinic closure (time off), shown on every day in the range. */
  isAllDayClosed?: boolean;
};

export type DoctorCalendarSlotConfiguration = {
  dayOfWeek: number;
  startTime: Date;
  endTime: Date;
  timezone: string;
  validFrom?: Date;
  validUntil?: Date | null;
};
