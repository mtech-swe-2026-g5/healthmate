import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/jobs/send-reminders/route";

const mockSendDueAppointmentReminders = vi.fn();

vi.mock("@/features/notifications", () => ({
  sendDueAppointmentReminders: (...args: unknown[]) =>
    mockSendDueAppointmentReminders(...args),
}));

describe("send-reminders job route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.REMINDER_JOB_SECRET = "secret-123";
    mockSendDueAppointmentReminders.mockResolvedValue({
      runAt: "2026-08-19T08:05:00+05:30",
      summaries: [],
    });
  });

  it("returns 401 when the shared secret is missing", async () => {
    const response = await POST(new Request("http://localhost/api/jobs/send-reminders", {
      method: "POST",
    }));

    expect(response.status).toBe(401);
    expect(mockSendDueAppointmentReminders).not.toHaveBeenCalled();
  });

  it("returns 401 when the shared secret is invalid", async () => {
    const response = await POST(new Request("http://localhost/api/jobs/send-reminders", {
      method: "POST",
      headers: { "x-job-secret": "nope" },
    }));

    expect(response.status).toBe(401);
    expect(mockSendDueAppointmentReminders).not.toHaveBeenCalled();
  });

  it("executes the reminder job with the correct shared secret", async () => {
    const response = await POST(new Request("http://localhost/api/jobs/send-reminders", {
      method: "POST",
      headers: { "x-job-secret": "secret-123" },
    }));

    expect(response.status).toBe(200);
    expect(mockSendDueAppointmentReminders).toHaveBeenCalledTimes(1);
    expect(await response.json()).toEqual({
      runAt: "2026-08-19T08:05:00+05:30",
      summaries: [],
    });
  });
});
