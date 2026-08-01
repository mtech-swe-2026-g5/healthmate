import { beforeEach, describe, expect, it, vi } from "vitest";

import { runAfterResponse } from "@/features/notifications/lib/scheduler";

const mockAfter = vi.fn();
const mockLogger = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

vi.mock("next/server", () => ({
  after: (task: () => Promise<void>) => mockAfter(task),
}));

vi.mock("@/lib/logger", () => ({ logger: mockLogger }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("runAfterResponse", () => {
  it("hands the task to next/server after()", async () => {
    const task = vi.fn().mockResolvedValue(undefined);

    runAfterResponse(task);

    expect(mockAfter).toHaveBeenCalledTimes(1);
    await mockAfter.mock.calls[0][0]();
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("runs the task detached when there is no request scope", async () => {
    mockAfter.mockImplementation(() => {
      throw new Error("`after` was called outside a request scope");
    });
    const task = vi.fn().mockResolvedValue(undefined);

    runAfterResponse(task);
    await vi.waitFor(() => expect(task).toHaveBeenCalledTimes(1));
  });

  it("logs instead of rejecting when the task throws", async () => {
    mockAfter.mockImplementation((task: () => Promise<void>) => task());
    const task = vi.fn().mockRejectedValue(new Error("smtp down"));

    runAfterResponse(task);

    await vi.waitFor(() =>
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Background notification task threw",
        expect.any(Error),
      ),
    );
  });
});
