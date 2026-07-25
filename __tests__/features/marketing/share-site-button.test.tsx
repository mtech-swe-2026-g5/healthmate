import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ShareSiteButton } from "@/features/marketing/components/ShareSiteButton";

describe("ShareSiteButton", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses the Web Share API when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share, clipboard: { writeText: vi.fn() } });

    render(<ShareSiteButton />);
    fireEvent.click(screen.getByRole("button", { name: /share healthmate/i }));

    await waitFor(() => {
      expect(share).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining("HealthMate"),
          url: expect.any(String),
        }),
      );
    });
  });

  it("copies the page URL when Web Share is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    render(<ShareSiteButton />);
    fireEvent.click(screen.getByRole("button", { name: /share healthmate/i }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(window.location.href);
    });
    expect(screen.getByRole("button", { name: /link copied/i })).toBeDefined();
  });

  it("does nothing when the user cancels the share sheet", async () => {
    const abortError = new Error("User cancelled");
    abortError.name = "AbortError";
    const share = vi.fn().mockRejectedValue(abortError);
    const writeText = vi.fn();
    vi.stubGlobal("navigator", { share, clipboard: { writeText } });

    render(<ShareSiteButton />);
    fireEvent.click(screen.getByRole("button", { name: /share healthmate/i }));

    await waitFor(() => {
      expect(share).toHaveBeenCalled();
    });
    expect(writeText).not.toHaveBeenCalled();
  });

  it("copies the link when share fails for a non-cancel reason", async () => {
    const share = vi.fn().mockRejectedValue(new Error("not supported"));
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share, clipboard: { writeText } });

    render(<ShareSiteButton />);
    fireEvent.click(screen.getByRole("button", { name: /share healthmate/i }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(window.location.href);
    });
  });

  it("opens a prompt when clipboard copy fails", async () => {
    const prompt = vi.fn();
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    vi.stubGlobal("prompt", prompt);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    render(<ShareSiteButton />);
    fireEvent.click(screen.getByRole("button", { name: /share healthmate/i }));

    await waitFor(() => {
      expect(prompt).toHaveBeenCalledWith(
        "Copy this link to share HealthMate:",
        window.location.href,
      );
    });
  });
});
