import { beforeEach, describe, expect, it, vi } from "vitest";

import { sendEmail } from "@/features/notifications/lib/mailer";
import type { EmailMessage } from "@/features/notifications";

const mockGetSmtpConfig = vi.fn();
const mockSendMail = vi.fn();
const mockLogger = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/features/notifications/lib/email-config", () => ({
  getSmtpConfig: () => mockGetSmtpConfig(),
}));

vi.mock("@/features/notifications/lib/transport", () => ({
  getTransporter: () => ({
    sendMail: (...args: unknown[]) => mockSendMail(...args),
  }),
}));

vi.mock("@/lib/logger", () => ({ logger: mockLogger }));

const SMTP_CONFIG = {
  host: "smtp.example.com",
  port: 587,
  secure: false,
  auth: { user: "mailer@example.com", pass: "s3cret" },
  from: "HealthMate <no-reply@healthmate.app>",
};

const message: EmailMessage = {
  to: "priya.sharma@example.com",
  subject: "Appointment confirmed",
  html: "<p>Confirmed</p>",
  text: "Confirmed",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSmtpConfig.mockReturnValue(SMTP_CONFIG);
});

describe("sendEmail", () => {
  it("sends through the configured sender on the first attempt", async () => {
    mockSendMail.mockResolvedValue({ messageId: "1" });

    const result = await sendEmail(message, { event: "appointment.booked" });

    expect(result).toEqual({ status: "sent", attempts: 1 });
    expect(mockSendMail).toHaveBeenCalledWith({
      from: SMTP_CONFIG.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  });

  it("skips delivery when SMTP is not configured", async () => {
    mockGetSmtpConfig.mockReturnValue(null);

    const result = await sendEmail(message);

    expect(result).toEqual({ status: "skipped", attempts: 0 });
    expect(mockSendMail).not.toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it("retries a transient SMTP failure and succeeds", async () => {
    mockSendMail
      .mockRejectedValueOnce(new Error("ECONNRESET"))
      .mockResolvedValueOnce({ messageId: "1" });

    const result = await sendEmail(message);

    expect(result).toEqual({ status: "sent", attempts: 2 });
    expect(mockSendMail).toHaveBeenCalledTimes(2);
  });

  // Exercises the full 500ms + 1s + 2s backoff ladder.
  it(
    "gives up after three retries and logs a critical error",
    { timeout: 15_000 },
    async () => {
      mockSendMail.mockRejectedValue(new Error("ECONNREFUSED"));

      const result = await sendEmail(message, {
        event: "appointment.booked",
        audience: "patient",
      });

      expect(result).toEqual({ status: "failed", attempts: 4 });
      expect(mockSendMail).toHaveBeenCalledTimes(4);
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Email notification failed after all retries",
        expect.any(Error),
        expect.objectContaining({ severity: "critical" }),
      );
    },
  );

  it("masks the recipient address in logs", async () => {
    mockSendMail.mockResolvedValue({ messageId: "1" });

    await sendEmail(message);

    expect(mockLogger.info).toHaveBeenCalledWith(
      "Email notification sent",
      expect.objectContaining({ recipient: "p***a@example.com" }),
    );
  });
});
