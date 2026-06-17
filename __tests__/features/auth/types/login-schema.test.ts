import { describe, expect, it } from 'vitest';

import { loginSchema, credentialsAuthorizeSchema } from '@/features/auth/types/schemas';

describe('loginSchema', () => {
  it('accepts valid credentials with role and rememberMe', () => {
    const result = loginSchema.safeParse({
      email: 'jane@example.com',
      password: 'anything',
      role: 'patient',
      rememberMe: false,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe('patient');
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
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown role', () => {
    const result = loginSchema.safeParse({
      email: 'jane@example.com',
      password: 'x',
      role: 'admin',
    });
    expect(result.success).toBe(false);
  });
});

describe('credentialsAuthorizeSchema', () => {
  it('parses the string "true" into a boolean rememberMe', () => {
    const result = credentialsAuthorizeSchema.safeParse({
      email: 'jane@example.com',
      password: 'x',
      role: 'patient',
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
