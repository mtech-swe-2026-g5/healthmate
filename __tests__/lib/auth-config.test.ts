import { describe, expect, it } from "vitest";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

import authConfig, {
  resolveSessionMaxAge,
  SESSION_MAX_AGE,
  SESSION_MAX_AGE_SHORT,
} from "@/lib/auth.config";

describe("resolveSessionMaxAge (remember me)", () => {
  it("uses the long horizon when remember me is on", () => {
    expect(resolveSessionMaxAge(true)).toBe(SESSION_MAX_AGE);
  });

  it("uses the short horizon when remember me is off", () => {
    expect(resolveSessionMaxAge(false)).toBe(SESSION_MAX_AGE_SHORT);
  });

  it("defaults to the long horizon when remember me is unset", () => {
    expect(resolveSessionMaxAge(undefined)).toBe(SESSION_MAX_AGE);
  });

  it("short horizon is shorter than the long horizon", () => {
    expect(SESSION_MAX_AGE_SHORT).toBeLessThan(SESSION_MAX_AGE);
  });
});

describe("authConfig", () => {
  it("uses the JWT strategy with the long session horizon", () => {
    expect(authConfig.session).toEqual({
      strategy: "jwt",
      maxAge: SESSION_MAX_AGE,
    });
  });

  it("points sign-in and error pages at /login", () => {
    expect(authConfig.pages).toEqual({
      signIn: "/login",
      error: "/login",
    });
  });

  it("has no providers configured (Credentials provider lives in auth.ts)", () => {
    expect(authConfig.providers).toEqual([]);
  });

  describe("callbacks.jwt", () => {
    it("merges the user into the token when a user is present", () => {
      const token = { sub: "existing-sub" } as JWT;
      const user = {
        id: "user-1",
        email: "user@example.com",
        role: "patient",
        roleId: 1,
        doctor: {},
        patient: {},
      };

      const result = authConfig.callbacks.jwt({
        token,
        user,
      } as Parameters<typeof authConfig.callbacks.jwt>[0]);

      expect(result).toEqual({ ...token, ...user });
    });

    it("returns the token unchanged when no user is present", () => {
      const token = { sub: "existing-sub" } as JWT;

      const result = authConfig.callbacks.jwt({
        token,
        user: undefined,
      } as unknown as Parameters<typeof authConfig.callbacks.jwt>[0]);

      expect(result).toBe(token);
    });
  });

  describe("callbacks.session", () => {
    it("strips JWT-only fields and merges the rest into session.user", () => {
      const session = { user: { name: "Existing" }, expires: "" } as Session;
      const token = {
        sub: "user-1",
        iat: 1,
        exp: 2,
        jti: "jti-1",
        id: "user-1",
        email: "user@example.com",
        role: "patient",
        roleId: 1,
      } as JWT;

      const result = authConfig.callbacks.session({
        session,
        token,
      } as Parameters<typeof authConfig.callbacks.session>[0]);

      expect(result.user).toEqual({
        name: "Existing",
        id: "user-1",
        email: "user@example.com",
        role: "patient",
        roleId: 1,
      });
    });

    it("returns the session unchanged when no token is present", () => {
      const session = { user: { name: "Existing" }, expires: "" } as Session;

      const result = authConfig.callbacks.session({
        session,
        token: undefined,
      } as unknown as Parameters<typeof authConfig.callbacks.session>[0]);

      expect(result).toBe(session);
    });
  });
});
