import { render, screen, cleanup, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";

import { Toast } from "@/components/ui/Toast";

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("should render the message", () => {
    render(<Toast message="Hello" onClose={vi.fn()} />);
    expect(screen.getByText("Hello")).toBeDefined();
  });

  it("should render with success variant by default", () => {
    render(<Toast message="Success!" onClose={vi.fn()} />);
    const toast = screen.getByRole("status");
    expect(toast.className).toContain("border-[var(--color-primary)]");
  });

  it("should render with error variant", () => {
    render(<Toast message="Error!" variant="error" onClose={vi.fn()} />);
    const toast = screen.getByRole("status");
    expect(toast.className).toContain("border-[var(--color-error)]");
  });

  it("should call onClose when dismiss button is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Toast message="Hello" onClose={onClose} />);

    await user.click(screen.getByLabelText(/dismiss notification/i));

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onClose).toHaveBeenCalled();
  });

  it("should auto-dismiss after duration", () => {
    const onClose = vi.fn();
    render(<Toast message="Hello" duration={2000} onClose={onClose} />);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onClose).toHaveBeenCalled();
  });

  it("should have aria-live polite attribute", () => {
    render(<Toast message="Hello" onClose={vi.fn()} />);
    const toast = screen.getByRole("status");
    expect(toast.getAttribute("aria-live")).toBe("polite");
  });
});
