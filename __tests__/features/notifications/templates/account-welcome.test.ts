import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWelcomeEmail } from "@/features/notifications/templates";

const patient = {
  email: "priya.sharma@example.com",
  firstName: "Priya",
  role: "patient" as const,
};

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://healthmate.app");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("renderWelcomeEmail", () => {
  it("greets the new patient and confirms their sign-in email", () => {
    const email = renderWelcomeEmail(patient);

    expect(email.to).toBe("priya.sharma@example.com");
    expect(email.subject).toBe("Welcome to HealthMate — your account is ready");
    expect(email.text).toContain("Hi Priya,");
    expect(email.text).toContain("Sign-in email: priya.sharma@example.com");
    expect(email.text).toContain("Account type: Patient");
  });

  it("links a patient to the patient portal", () => {
    expect(renderWelcomeEmail(patient).html).toContain(
      'href="https://healthmate.app/dashboard"',
    );
  });

  it("links a doctor to the doctor portal with doctor copy", () => {
    const email = renderWelcomeEmail({ ...patient, role: "doctor" });

    expect(email.html).toContain('href="https://healthmate.app/doctor"');
    expect(email.text).toContain("Account type: Doctor");
    expect(email.text).toContain("manage your schedule");
  });

  it("escapes a name containing markup", () => {
    const email = renderWelcomeEmail({
      ...patient,
      firstName: '<script>alert("x")</script>',
    });

    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
  });
});
