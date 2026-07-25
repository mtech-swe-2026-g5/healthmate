import { describe, expect, it } from "vitest";

import {
  daysUntil,
  formatCountdownLabel,
  greetingForHour,
} from "@/features/dashboard/lib/greeting";

describe("greetingForHour", () => {
  it("returns morning, afternoon, and evening greetings", () => {
    expect(greetingForHour(8)).toBe("Good morning");
    expect(greetingForHour(14)).toBe("Good afternoon");
    expect(greetingForHour(19)).toBe("Good evening");
  });
});

describe("daysUntil", () => {
  it("counts whole days between two dates", () => {
    const from = new Date(2024, 9, 24);
    const target = new Date(2024, 9, 28);
    expect(daysUntil(target, from)).toBe(4);
  });

  it("returns 0 for the same calendar day", () => {
    const day = new Date(2024, 9, 24, 9);
    const later = new Date(2024, 9, 24, 18);
    expect(daysUntil(later, day)).toBe(0);
  });
});

describe("formatCountdownLabel", () => {
  it("formats today, singular, and plural day labels", () => {
    expect(formatCountdownLabel(0)).toBe("Today");
    expect(formatCountdownLabel(1)).toBe("1 Day");
    expect(formatCountdownLabel(4)).toBe("4 Days");
  });
});
