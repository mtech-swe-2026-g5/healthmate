import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SlotGrid } from "@/features/appointments/components/SlotGrid";

describe("SlotGrid", () => {
  afterEach(() => {
    cleanup();
  });

  it("marks booked slots and prevents selection", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <SlotGrid
        slots={[
          { startTime: "11:00", endTime: "12:00", status: "available" },
          { startTime: "12:00", endTime: "13:00", status: "booked" },
        ]}
        selectedStartTime={null}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText(/Booked/i)).toBeDefined();
    await user.click(screen.getByRole("button", { name: /12:00/i }));
    expect(onSelect).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /11:00/i }));
    expect(onSelect).toHaveBeenCalledWith("11:00", "12:00");
  });

  it("shows selected and unavailable slot styles", () => {
    render(
      <SlotGrid
        slots={[
          { startTime: "11:00", endTime: "12:00", status: "available" },
          { startTime: "12:00", endTime: "13:00", status: "unavailable" },
        ]}
        selectedStartTime="11:00"
        onSelect={vi.fn()}
      />,
    );

    expect(
      screen
        .getByRole("button", { name: /11:00/i })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(screen.getByRole("button", { name: /12:00/i })).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("shows loading and error states", () => {
    const { rerender } = render(
      <SlotGrid
        slots={[]}
        selectedStartTime={null}
        onSelect={vi.fn()}
        loading
      />,
    );
    expect(screen.getByText(/Loading slots/i)).toBeDefined();

    rerender(
      <SlotGrid
        slots={[]}
        selectedStartTime={null}
        onSelect={vi.fn()}
        error="Failed to load slots"
      />,
    );
    expect(screen.getByRole("alert").textContent).toContain(
      "Failed to load slots",
    );

    rerender(
      <SlotGrid slots={[]} selectedStartTime={null} onSelect={vi.fn()} />,
    );
    expect(screen.getByText(/Select a date/i)).toBeDefined();
  });
});
