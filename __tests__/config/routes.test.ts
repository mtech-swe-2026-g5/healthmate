import { describe, expect, it } from 'vitest';

import {
  canRoleAccessPath,
  getRoleHome,
  isAuthOnlyRoute,
  isDoctorRoute,
  isPatientRoute,
  isPublicRoute,
  matchRouteAccess,
  resolvePostLoginRedirect,
  sanitizeCallbackUrl,
} from '@/config/routes';

describe('getRoleHome', () => {
  it('sends patients to the patient dashboard', () => {
    expect(getRoleHome('patient')).toBe('/dashboard');
  });

  it('sends doctors and admins to the doctor portal', () => {
    expect(getRoleHome('doctor')).toBe('/doctor');
    expect(getRoleHome('admin')).toBe('/doctor');
  });

  it('falls back to the patient home for unknown roles', () => {
    expect(getRoleHome(undefined)).toBe('/dashboard');
    expect(getRoleHome('unknown')).toBe('/dashboard');
  });
});

describe('route matchers', () => {
  it('classifies public and auth-only routes', () => {
    expect(isPublicRoute('/')).toBe(true);
    expect(isAuthOnlyRoute('/login')).toBe(true);
    expect(isAuthOnlyRoute('/register')).toBe(true);
    expect(matchRouteAccess('/')).toBe('public');
    expect(matchRouteAccess('/login')).toBe('authOnly');
  });

  it('classifies patient portal routes', () => {
    expect(isPatientRoute('/dashboard')).toBe(true);
    expect(isPatientRoute('/profile')).toBe(true);
    expect(isPatientRoute('/appointments')).toBe(true);
    expect(isPatientRoute('/appointments/book')).toBe(true);
    expect(isPatientRoute('/appointments/abc')).toBe(true);
    expect(isPatientRoute('/doctor')).toBe(false);
    expect(matchRouteAccess('/appointments/book')).toBe('patient');
    expect(matchRouteAccess('/profile')).toBe('patient');
  });

  it('classifies doctor portal routes', () => {
    expect(isDoctorRoute('/doctor')).toBe(true);
    expect(isDoctorRoute('/doctor/schedule')).toBe(true);
    expect(isDoctorRoute('/doctor/patients')).toBe(true);
    expect(isDoctorRoute('/dashboard')).toBe(false);
    expect(matchRouteAccess('/doctor/schedule')).toBe('doctor');
  });
});

describe('canRoleAccessPath', () => {
  it('allows patients on patient routes only', () => {
    expect(canRoleAccessPath('patient', '/dashboard')).toBe(true);
    expect(canRoleAccessPath('patient', '/appointments')).toBe(true);
    expect(canRoleAccessPath('patient', '/doctor')).toBe(false);
  });

  it('allows doctors and admins on doctor routes only', () => {
    expect(canRoleAccessPath('doctor', '/doctor')).toBe(true);
    expect(canRoleAccessPath('admin', '/doctor/patients')).toBe(true);
    expect(canRoleAccessPath('doctor', '/appointments')).toBe(false);
  });

  it('allows anyone on public routes', () => {
    expect(canRoleAccessPath(null, '/')).toBe(true);
    expect(canRoleAccessPath('patient', '/')).toBe(true);
  });

  it('treats unknown authenticated pages as any logged-in role', () => {
    expect(matchRouteAccess('/settings')).toBe('authenticated');
    expect(canRoleAccessPath('patient', '/settings')).toBe(true);
    expect(canRoleAccessPath(undefined, '/settings')).toBe(false);
  });

  it('rejects auth-only paths for logged-in role checks', () => {
    expect(canRoleAccessPath('patient', '/login')).toBe(false);
  });
});

describe('resolvePostLoginRedirect', () => {
  it('uses a safe same-origin callback when the role may access it', () => {
    expect(resolvePostLoginRedirect('patient', '/appointments/book')).toBe(
      '/appointments/book',
    );
    expect(resolvePostLoginRedirect('doctor', '/doctor/schedule')).toBe(
      '/doctor/schedule',
    );
  });

  it('rejects callbacks the role cannot access', () => {
    expect(resolvePostLoginRedirect('doctor', '/appointments')).toBe('/doctor');
    expect(resolvePostLoginRedirect('patient', '/doctor')).toBe('/dashboard');
  });

  it('rejects absolute and protocol-relative callbacks', () => {
    expect(sanitizeCallbackUrl('https://evil.example/phish', 'patient')).toBe(
      null,
    );
    expect(sanitizeCallbackUrl('//evil.example', 'patient')).toBe(null);
    expect(sanitizeCallbackUrl('/api/appointments', 'patient')).toBe(null);
    expect(sanitizeCallbackUrl('/login', 'patient')).toBe(null);
  });

  it('falls back to role home when callback is missing', () => {
    expect(resolvePostLoginRedirect('patient')).toBe('/dashboard');
    expect(resolvePostLoginRedirect('doctor', null)).toBe('/doctor');
  });
});
