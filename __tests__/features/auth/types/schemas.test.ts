import { describe, expect, it } from "vitest";

import {
  registrationSchema,
  registrationApiSchema,
} from "@/features/auth/types/schemas";

const VALID_INPUT = {
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  password: "Secure1!pass",
  confirmPassword: "Secure1!pass",
  dateOfBirth: "2000-01-15",
  gender: "male" as const,
  phoneNumber: "+919876543210",
};

const VALID_API_INPUT = {
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  password: "Secure1!pass",
  dateOfBirth: "2000-01-15",
  gender: "male" as const,
  phoneNumber: "+919876543210",
};

describe("registrationSchema", () => {
  it("should accept valid input", () => {
    const result = registrationSchema.safeParse(VALID_INPUT);
    expect(result.success).toBe(true);
  });

  it("should accept valid input with optional blood group", () => {
    const result = registrationSchema.safeParse({
      ...VALID_INPUT,
      bloodGroup: "O+",
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing first name", () => {
    const result = registrationSchema.safeParse({
      ...VALID_INPUT,
      firstName: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing last name", () => {
    const result = registrationSchema.safeParse({
      ...VALID_INPUT,
      lastName: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject first name exceeding 100 characters", () => {
    const result = registrationSchema.safeParse({
      ...VALID_INPUT,
      firstName: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid email", () => {
    const result = registrationSchema.safeParse({
      ...VALID_INPUT,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("should reject password shorter than 8 characters", () => {
    const result = registrationSchema.safeParse({
      ...VALID_INPUT,
      password: "Ab1!",
      confirmPassword: "Ab1!",
    });
    expect(result.success).toBe(false);
  });

  it("should reject password without uppercase letter", () => {
    const result = registrationSchema.safeParse({
      ...VALID_INPUT,
      password: "secure1!pass",
      confirmPassword: "secure1!pass",
    });
    expect(result.success).toBe(false);
  });

  it("should reject password without a number", () => {
    const result = registrationSchema.safeParse({
      ...VALID_INPUT,
      password: "Secure!pass",
      confirmPassword: "Secure!pass",
    });
    expect(result.success).toBe(false);
  });

  it("should reject password without a special character", () => {
    const result = registrationSchema.safeParse({
      ...VALID_INPUT,
      password: "Secure1pass",
      confirmPassword: "Secure1pass",
    });
    expect(result.success).toBe(false);
  });

  it("should reject mismatched confirm password", () => {
    const result = registrationSchema.safeParse({
      ...VALID_INPUT,
      confirmPassword: "Different1!",
    });
    expect(result.success).toBe(false);
  });

  it("should reject future date of birth", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const result = registrationSchema.safeParse({
      ...VALID_INPUT,
      dateOfBirth: futureDate.toISOString(),
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid gender value", () => {
    const result = registrationSchema.safeParse({
      ...VALID_INPUT,
      gender: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("should accept all valid gender values", () => {
    const genders = ["male", "female", "other", "prefer_not_to_say"] as const;
    for (const gender of genders) {
      const result = registrationSchema.safeParse({
        ...VALID_INPUT,
        gender,
      });
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid blood group value", () => {
    const result = registrationSchema.safeParse({
      ...VALID_INPUT,
      bloodGroup: "X+",
    });
    expect(result.success).toBe(false);
  });

  it("should accept all valid blood group values", () => {
    const groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
    for (const bloodGroup of groups) {
      const result = registrationSchema.safeParse({
        ...VALID_INPUT,
        bloodGroup,
      });
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid phone number", () => {
    const result = registrationSchema.safeParse({
      ...VALID_INPUT,
      phoneNumber: "abc",
    });
    expect(result.success).toBe(false);
  });

  it("should accept phone number without plus prefix", () => {
    const result = registrationSchema.safeParse({
      ...VALID_INPUT,
      phoneNumber: "9876543210",
    });
    expect(result.success).toBe(true);
  });
});

describe("registrationApiSchema", () => {
  it("should accept valid API input without confirmPassword", () => {
    const result = registrationApiSchema.safeParse(VALID_API_INPUT);
    expect(result.success).toBe(true);
  });

  it("should reject invalid API input", () => {
    const result = registrationApiSchema.safeParse({
      ...VALID_API_INPUT,
      email: "bad",
    });
    expect(result.success).toBe(false);
  });

  it("should accept optional blood group in API schema", () => {
    const result = registrationApiSchema.safeParse({
      ...VALID_API_INPUT,
      bloodGroup: "AB-",
    });
    expect(result.success).toBe(true);
  });
});
