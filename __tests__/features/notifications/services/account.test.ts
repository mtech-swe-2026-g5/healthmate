import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  scheduleWelcomeEmail,
  sendWelcomeEmail,
} from "@/features/notifications/services/account";

const mockSendEmail = vi.fn();
const mockRunAfterResponse = vi.fn();
const mockLogger = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/features/notifications/lib/mailer", () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

vi.mock("@/features/notifications/lib/scheduler", () => ({
  runAfterResponse: (task: () => Promise<void>) => mockRunAfterResponse(task),
}));

vi.mock("@/lib/logger", () => ({ logger: mockLogger }));

const input = {
  email: "priya.sharma@example.com",
  firstName: "Priya",
  role: "patient" as const,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockSendEmail.mockResolvedValue({ status: "sent", attempts: 1 });
});

describe("sendWelcomeEmail", () => {
  it("sends the welcome template to the new account's email", async () => {
    const result = await sendWelcomeEmail(input);

    expect(result).toEqual({ status: "sent", attempts: 1 });
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "priya.sharma@example.com" }),
      { event: "account.registered", role: "patient" },
    );
  });

  it("reports a failure instead of throwing when delivery rejects", async () => {
    mockSendEmail.mockRejectedValue(new Error("render failed"));

    await expect(sendWelcomeEmail(input)).resolves.toEqual({
      status: "failed",
      attempts: 0,
    });
    expect(mockLogger.error).toHaveBeenCalled();
  });
});

describe("scheduleWelcomeEmail", () => {
  it("defers delivery until after the response", async () => {
    scheduleWelcomeEmail(input);

    expect(mockRunAfterResponse).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).not.toHaveBeenCalled();

    await mockRunAfterResponse.mock.calls[0][0]();
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });
});
