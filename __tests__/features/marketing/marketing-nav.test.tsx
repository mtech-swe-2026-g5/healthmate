import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MarketingNav } from "@/features/marketing/components/MarketingNav";

vi.mock("@/features/auth/components/LogoutButton", () => ({
  LogoutButton: ({ className }: { className?: string }) => (
    <button type="button" className={className}>
      Log out
    </button>
  ),
}));

describe("MarketingNav", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows open portal + logout when logged in", async () => {
    const user = userEvent.setup();
    render(<MarketingNav isLoggedIn portalHref="/doctor" />);

    const portalLinks = screen.getAllByRole("link", { name: "Open portal" });
    expect(portalLinks.length).toBeGreaterThan(0);
    expect(portalLinks[0]?.getAttribute("href")).toBe("/doctor");
    expect(screen.queryByRole("link", { name: "Appointments" })).toBeNull();

    await user.click(screen.getByRole("button", { name: /open menu/i }));
    expect(
      screen.getAllByRole("link", { name: "Open portal" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: "Log out" }).length,
    ).toBeGreaterThan(0);
  });

  it("shows marketing links when logged out", async () => {
    const user = userEvent.setup();
    render(<MarketingNav isLoggedIn={false} />);
    expect(
      screen.getAllByRole("link", { name: "Log in" }).length,
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /open menu/i }));
    expect(
      screen.getAllByRole("link", { name: "Features" }).length,
    ).toBeGreaterThan(0);
    await user.click(
      screen.getByRole("button", { name: /dismiss navigation menu/i }),
    );
  });
});
