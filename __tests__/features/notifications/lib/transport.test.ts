import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getTransporter,
  resetTransporter,
} from "@/features/notifications/lib/transport";
import type { SmtpConfig } from "@/features/notifications";

const mockCreateTransport = vi.fn();

vi.mock("nodemailer", () => ({
  default: {
    createTransport: (...args: unknown[]) => mockCreateTransport(...args),
  },
}));

const config: SmtpConfig = {
  host: "smtp.example.com",
  port: 587,
  secure: false,
  auth: { user: "mailer@example.com", pass: "s3cret" },
  from: "HealthMate <no-reply@healthmate.app>",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateTransport.mockImplementation(() => ({ close: vi.fn() }));
  resetTransporter();
});

afterEach(() => {
  resetTransporter();
});

describe("getTransporter", () => {
  it("creates a pooled transporter from the SMTP config", () => {
    getTransporter(config);

    expect(mockCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.example.com",
        port: 587,
        secure: false,
        auth: config.auth,
        pool: true,
      }),
    );
  });

  it("omits auth for relays without credentials", () => {
    getTransporter({ ...config, auth: null });

    expect(mockCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({ auth: undefined }),
    );
  });

  it("reuses the transporter for an unchanged config", () => {
    const first = getTransporter(config);
    const second = getTransporter(config);

    expect(second).toBe(first);
    expect(mockCreateTransport).toHaveBeenCalledTimes(1);
  });

  it("closes and replaces the transporter when the config changes", () => {
    const first = getTransporter(config);
    const second = getTransporter({ ...config, host: "smtp.other.com" });

    expect(second).not.toBe(first);
    expect(first.close).toHaveBeenCalledTimes(1);
    expect(mockCreateTransport).toHaveBeenCalledTimes(2);
  });
});
