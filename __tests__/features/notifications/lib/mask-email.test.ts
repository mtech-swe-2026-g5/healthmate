import { describe, expect, it } from "vitest";

import { maskEmail } from "@/features/notifications/lib/mask-email";

describe("maskEmail", () => {
  it("keeps the first and last local characters plus the domain", () => {
    expect(maskEmail("priya.sharma@example.com")).toBe("p***a@example.com");
  });

  it("masks short local parts without leaking the whole name", () => {
    expect(maskEmail("jo@example.com")).toBe("j***@example.com");
  });

  it("returns a fully masked value when there is no local part", () => {
    expect(maskEmail("@example.com")).toBe("***");
    expect(maskEmail("not-an-email")).toBe("***");
  });
});
