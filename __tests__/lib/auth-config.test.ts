import { describe, expect, it } from 'vitest';

import {
  resolveSessionMaxAge,
  SESSION_MAX_AGE,
  SESSION_MAX_AGE_SHORT,
} from '@/lib/auth.config';

describe('resolveSessionMaxAge (remember me)', () => {
  it('uses the long horizon when remember me is on', () => {
    expect(resolveSessionMaxAge(true)).toBe(SESSION_MAX_AGE);
  });

  it('uses the short horizon when remember me is off', () => {
    expect(resolveSessionMaxAge(false)).toBe(SESSION_MAX_AGE_SHORT);
  });

  it('defaults to the long horizon when remember me is unset', () => {
    expect(resolveSessionMaxAge(undefined)).toBe(SESSION_MAX_AGE);
  });

  it('short horizon is shorter than the long horizon', () => {
    expect(SESSION_MAX_AGE_SHORT).toBeLessThan(SESSION_MAX_AGE);
  });
});
