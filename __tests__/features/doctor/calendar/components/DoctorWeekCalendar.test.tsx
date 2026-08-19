import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DoctorWeekCalendar } from "@/features/doctor/calendar/components/DoctorWeekCalendar";
import type { DoctorCalendarEvent } from "@/features/doctor/calendar/types";
import { getCalendarWeekRange } from "@/lib/calendar-week";

vi.mock("@/components/ui/AppCalendar", () => ({
  isSlotActive: vi.fn(() => true),
}));

describe("DoctorWeekCalendar", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const weekStart = getCalendarWeekRange(
    new Date("2026-07-14T12:00:00Z"),
  ).start;
  const events: DoctorCalendarEvent[] = [
    {
      id: "apt-1",
      title: "John Doe",
      start: new Date("2026-07-14T10:00:00"),
      end: new Date("2026-07-14T11:00:00"),
      variant: "appointment",
    },
  ];

  it("renders week grid and appointment events", () => {
    render(
      <DoctorWeekCalendar
        weekStart={weekStart}
        events={events}
        isLoading={false}
      />,
    );

    expect(screen.getByText("John Doe")).toBeDefined();
    expect(screen.getByText("Time")).toBeDefined();
  });

  it("shows loading overlay when loading", () => {
    render(<DoctorWeekCalendar weekStart={weekStart} events={[]} isLoading />);

    expect(screen.getByText("Loading schedule…")).toBeDefined();
  });

  it("calls onEventSelect when an appointment is clicked", async () => {
    const user = userEvent.setup();
    const onEventSelect = vi.fn();

    render(
      <DoctorWeekCalendar
        weekStart={weekStart}
        events={events}
        onEventSelect={onEventSelect}
      />,
    );

    await user.click(screen.getByText("John Doe"));
    expect(onEventSelect).toHaveBeenCalledWith(events[0]);
  });

  it("renders navigation controls when enabled", async () => {
    const user = userEvent.setup();
    const onWeekChange = vi.fn();

    render(
      <DoctorWeekCalendar
        weekStart={weekStart}
        events={[]}
        showNavigation
        onWeekChange={onWeekChange}
      />,
    );

    await user.click(screen.getByLabelText("Next week"));
    expect(onWeekChange).toHaveBeenCalledTimes(1);
  });
});
