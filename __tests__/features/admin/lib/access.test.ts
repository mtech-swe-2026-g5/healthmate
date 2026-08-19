import { describe, expect, it } from "vitest";

import { assertAdminAccess } from "@/features/admin/lib/access";
import { AppError } from "@/lib/errors";

describe("assertAdminAccess", () => {
  it("allows admin role", () => {
    expect(() => assertAdminAccess("admin")).not.toThrow();
  });

  it("rejects missing role with 401", () => {
    expect(() => assertAdminAccess(undefined)).toThrow(AppError);
    try {
      assertAdminAccess(undefined);
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).status).toBe(401);
    }
  });

  it("rejects doctor role with 403", () => {
    expect(() => assertAdminAccess("doctor")).toThrow(AppError);
    try {
      assertAdminAccess("doctor");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).status).toBe(403);
    }
  });

  it("rejects patient role with 403", () => {
    expect(() => assertAdminAccess("patient")).toThrow(AppError);
  });
});
