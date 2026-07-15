import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { RegistrationForm } from "@/features/auth/components/RegistrationForm";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

global.fetch = vi.fn();

describe("RegistrationForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("should render all required form fields", () => {
    render(<RegistrationForm />);

    expect(screen.getByLabelText(/first name/i)).toBeDefined();
    expect(screen.getByLabelText(/last name/i)).toBeDefined();
    expect(screen.getByLabelText(/^email/i)).toBeDefined();
    expect(document.getElementById("password")).toBeDefined();
    expect(document.getElementById("confirmPassword")).toBeDefined();
    expect(screen.getByLabelText(/date of birth/i)).toBeDefined();
    expect(screen.getByLabelText(/gender/i)).toBeDefined();
    expect(screen.getByLabelText(/phone number/i)).toBeDefined();
    expect(screen.getByLabelText(/blood group/i)).toBeDefined();
  });

  it("should render the submit button", () => {
    render(<RegistrationForm />);
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeDefined();
  });

  it("should render link to login page", () => {
    render(<RegistrationForm />);
    const link = screen.getByRole("link", { name: /log in/i });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("/login");
  });

  it("should have accessible form label", () => {
    render(<RegistrationForm />);
    expect(
      screen.getByRole("form", { name: /patient registration form/i }),
    ).toBeDefined();
  });

  it("should mark required fields with aria-required", () => {
    render(<RegistrationForm />);
    expect(
      screen.getByLabelText(/first name/i).getAttribute("aria-required"),
    ).toBe("true");
    expect(screen.getByLabelText(/^email/i).getAttribute("aria-required")).toBe(
      "true",
    );
    expect(
      document.getElementById("password")?.getAttribute("aria-required"),
    ).toBe("true");
    expect(screen.getByLabelText(/gender/i).getAttribute("aria-required")).toBe(
      "true",
    );
  });

  it("should show validation errors when submitting empty form", async () => {
    const user = userEvent.setup();
    render(<RegistrationForm />);

    await user.click(screen.getByRole("button", { name: /create account/i }));

    const alerts = await screen.findAllByRole("alert");
    expect(alerts.length).toBeGreaterThan(0);
  });

  it("should render gender options correctly", () => {
    render(<RegistrationForm />);
    const genderSelect = screen.getByLabelText(/gender/i) as HTMLSelectElement;
    const options = Array.from(genderSelect.options).map((o) => o.value);
    expect(options).toContain("male");
    expect(options).toContain("female");
    expect(options).toContain("other");
    expect(options).toContain("prefer_not_to_say");
  });

  it("should render blood group options correctly", () => {
    render(<RegistrationForm />);
    const bgSelect = screen.getByLabelText(/blood group/i) as HTMLSelectElement;
    const options = Array.from(bgSelect.options).map((o) => o.value);
    expect(options).toContain("A+");
    expect(options).toContain("O-");
    expect(options).toContain("AB+");
  });

  it("should render HealthMate branding", () => {
    render(<RegistrationForm />);
    expect(screen.getByText("HealthMate")).toBeDefined();
    expect(screen.getByText("Create your account")).toBeDefined();
  });

  it("should display mandatory field indicators (*)", () => {
    render(<RegistrationForm />);
    const firstNameLabel = screen
      .getByLabelText(/first name/i)
      .closest(".floating-label-group")
      ?.querySelector("label");
    expect(firstNameLabel?.textContent).toContain("*");
  });

  it("should toggle password visibility", async () => {
    const user = userEvent.setup();
    render(<RegistrationForm />);

    const passwordInput = document.getElementById(
      "password",
    ) as HTMLInputElement;
    expect(passwordInput.type).toBe("password");

    const toggleBtn = screen.getByRole("button", { name: /^show password$/i });
    await user.click(toggleBtn);
    expect(passwordInput.type).toBe("text");

    await user.click(screen.getByRole("button", { name: /^hide password$/i }));
    expect(passwordInput.type).toBe("password");
  });

  it("should toggle confirm password visibility", async () => {
    const user = userEvent.setup();
    render(<RegistrationForm />);

    const confirmInput = document.getElementById(
      "confirmPassword",
    ) as HTMLInputElement;
    expect(confirmInput.type).toBe("password");

    const toggleBtn = screen.getByRole("button", {
      name: /show confirm password/i,
    });
    await user.click(toggleBtn);
    expect(confirmInput.type).toBe("text");

    await user.click(
      screen.getByRole("button", { name: /hide confirm password/i }),
    );
    expect(confirmInput.type).toBe("password");
  });

  it("should show warning icons alongside validation errors", async () => {
    const user = userEvent.setup();
    render(<RegistrationForm />);

    await user.click(screen.getByRole("button", { name: /create account/i }));

    const alerts = await screen.findAllByRole("alert");
    for (const alert of alerts) {
      const svg = alert.querySelector("svg");
      expect(svg).not.toBeNull();
    }
  });
});
