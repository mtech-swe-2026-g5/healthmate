import { describe, expect, it } from 'vitest';

import { loginSchema, credentialsAuthorizeSchema } from '@/features/auth/types/schemas';

describe('loginSchema', () => {
  it('accepts valid credentials with rememberMe', () => {
    const result = loginSchema.safeParse({
      email: 'jane@example.com',
      password: 'anything',
      rememberMe: false,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rememberMe).toBe(false);
    }
  });

  it('rejects an empty email', () => {
    const result = loginSchema.safeParse({ email: '', password: 'x' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = loginSchema.safeParse({ email: 'nope', password: 'x' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty password', () => {
    const result = loginSchema.safeParse({
      email: 'jane@example.com',
      password: '',
      rememberMe: false,
    });
    expect(result.success).toBe(false);
  });
});

describe('credentialsAuthorizeSchema', () => {
  it('parses the string "true" into a boolean rememberMe', () => {
    const result = credentialsAuthorizeSchema.safeParse({
      email: 'jane@example.com',
      password: 'x',
      rememberMe: 'true',
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.rememberMe).toBe(true);
  });

  it('parses the string "false" into false (not coerced to true)', () => {
    const result = credentialsAuthorizeSchema.safeParse({
      email: 'jane@example.com',
      password: 'x',
      rememberMe: 'false',
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.rememberMe).toBe(false);
  });

  it('defaults rememberMe to false when omitted', () => {
    const result = credentialsAuthorizeSchema.safeParse({
      email: 'jane@example.com',
      password: 'x',
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.rememberMe).toBe(false);
  });

  it('rejects a missing password', () => {
    const result = credentialsAuthorizeSchema.safeParse({
      email: 'jane@example.com',
    });
    expect(result.success).toBe(false);
  });
});
