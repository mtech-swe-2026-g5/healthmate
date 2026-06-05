import { describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

import { handleApiError } from '@/lib/errors';

describe('handleApiError', () => {
  it('should return 400 for ZodError', async () => {
    const error = new ZodError([
      {
        code: 'too_small',
        minimum: 1,
        type: 'string',
        inclusive: true,
        exact: false,
        message: 'Required',
        path: ['email'],
      },
    ]);

    const response = handleApiError(error);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Validation failed');
    expect(json.issues).toHaveLength(1);
    expect(json.issues[0].path).toBe('email');
  });

  it('should return 409 for Prisma P2002 unique constraint', async () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: '7.0.0',
        meta: { target: ['email'] },
      },
    );

    const response = handleApiError(error);
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error).toContain('email');
  });

  it('should return 409 with field name for non-email unique constraint', async () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: '7.0.0',
        meta: { target: ['phone_number'] },
      },
    );

    const response = handleApiError(error);
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error).toContain('phone_number');
  });

  it('should return 404 for Prisma P2025 not found', async () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Record not found',
      {
        code: 'P2025',
        clientVersion: '7.0.0',
      },
    );

    const response = handleApiError(error);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe('Record not found');
  });

  it('should return 500 for unknown errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Something unexpected');

    const response = handleApiError(error);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Internal server error');
    consoleSpy.mockRestore();
  });

  it('should return 500 for non-Error objects', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = handleApiError('string error');
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Internal server error');
    consoleSpy.mockRestore();
  });

  it('should handle P2002 with empty meta target', async () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: '7.0.0',
        meta: { target: [] },
      },
    );

    const response = handleApiError(error);
    expect(response.status).toBe(409);
  });
});
