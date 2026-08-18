import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getAppUrl,
  getSmtpConfig,
  isEmailNotificationsEnabled,
} from "@/features/notifications/lib/email-config";

function configureSmtp(overrides: Record<string, string> = {}): void {
  const env: Record<string, string> = {
    EMAIL_NOTIFICATIONS_ENABLED: "true",
    SMTP_HOST: "smtp.example.com",
    SMTP_PORT: "587",
    SMTP_USER: "mailer@example.com",
    SMTP_PASSWORD: "s3cret",
    EMAIL_FROM: "no-reply@healthmate.app",
    EMAIL_FROM_NAME: "HealthMate",
    ...overrides,
  };

  for (const [key, value] of Object.entries(env)) {
    vi.stubEnv(key, value);
  }
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isEmailNotificationsEnabled", () => {
  it("defaults to enabled when the flag is unset", () => {
    vi.stubEnv("EMAIL_NOTIFICATIONS_ENABLED", "");
    expect(isEmailNotificationsEnabled()).toBe(true);
  });

  it("is disabled only for an explicit false", () => {
    vi.stubEnv("EMAIL_NOTIFICATIONS_ENABLED", "false");
    expect(isEmailNotificationsEnabled()).toBe(false);
  });
});

describe("getSmtpConfig", () => {
  it("builds a config with a named sender", () => {
    configureSmtp();

    expect(getSmtpConfig()).toEqual({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      auth: { user: "mailer@example.com", pass: "s3cret" },
      from: "HealthMate <no-reply@healthmate.app>",
    });
  });

  it("enables implicit TLS on port 465", () => {
    configureSmtp({ SMTP_PORT: "465" });
    expect(getSmtpConfig()?.secure).toBe(true);
  });

  it("enables implicit TLS when SMTP_SECURE is true", () => {
    configureSmtp({ SMTP_SECURE: "true" });
    expect(getSmtpConfig()?.secure).toBe(true);
  });

  it("defaults the port when SMTP_PORT is unset", () => {
    configureSmtp({ SMTP_PORT: "" });
    expect(getSmtpConfig()?.port).toBe(587);
  });

  it("falls back to the SMTP user as sender address", () => {
    configureSmtp({ EMAIL_FROM: "", EMAIL_FROM_NAME: "" });
    expect(getSmtpConfig()?.from).toBe("HealthMate <mailer@example.com>");
  });

  it("omits auth for relays that do not require credentials", () => {
    configureSmtp({ SMTP_USER: "", SMTP_PASSWORD: "" });
    expect(getSmtpConfig()?.auth).toBeNull();
  });

  it("returns null when SMTP is not configured", () => {
    configureSmtp({ SMTP_HOST: "" });
    expect(getSmtpConfig()).toBeNull();
  });

  it("returns null when notifications are disabled", () => {
    configureSmtp({ EMAIL_NOTIFICATIONS_ENABLED: "false" });
    expect(getSmtpConfig()).toBeNull();
  });

  it("returns null for a non-numeric port", () => {
    configureSmtp({ SMTP_PORT: "not-a-port" });
    expect(getSmtpConfig()).toBeNull();
  });

  it("returns null when no sender address can be resolved", () => {
    configureSmtp({ EMAIL_FROM: "", SMTP_USER: "", SMTP_PASSWORD: "" });
    expect(getSmtpConfig()).toBeNull();
  });
});

describe("getAppUrl", () => {
  beforeEach(() => {
    for (const key of [
      "NEXT_PUBLIC_APP_URL",
      "AUTH_URL",
      "VERCEL",
      "VERCEL_URL",
      "VERCEL_PROJECT_PRODUCTION_URL",
    ]) {
      vi.stubEnv(key, "");
    }
  });

  it("uses the public app URL without a trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://healthmate.app/");
    expect(getAppUrl()).toBe("https://healthmate.app");
  });

  it("falls back to AUTH_URL then to localhost", () => {
    vi.stubEnv("AUTH_URL", "https://auth.healthmate.app");
    expect(getAppUrl()).toBe("https://auth.healthmate.app");

    vi.stubEnv("AUTH_URL", "");
    expect(getAppUrl()).toBe("http://localhost:3000");
  });

  it("detects the Vercel production domain with no configuration", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "healthmate-vert.vercel.app");

    expect(getAppUrl()).toBe("https://healthmate-vert.vercel.app");
  });

  it("falls back to the per-deployment host on previews", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_URL", "healthmate-git-branch.vercel.app");

    expect(getAppUrl()).toBe("https://healthmate-git-branch.vercel.app");
  });

  it("ignores a localhost override when deployed on Vercel", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    vi.stubEnv("AUTH_URL", "http://127.0.0.1:3000");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "healthmate-vert.vercel.app");

    expect(getAppUrl()).toBe("https://healthmate-vert.vercel.app");
  });

  it("still honours an explicit custom domain on Vercel", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.healthmate.com");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "healthmate-vert.vercel.app");

    expect(getAppUrl()).toBe("https://app.healthmate.com");
  });

  it("keeps localhost when running locally", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    expect(getAppUrl()).toBe("http://localhost:3000");
  });
});
