import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { useLogin } from '@/features/auth/hooks/use-login';

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockSignIn = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
}));

const VALID_DATA = {
  email: 'jane@example.com',
  password: 'Secure1!pass',
  role: 'patient' as const,
  rememberMe: true,
};

describe('useLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls signIn with credentials and redirect disabled', async () => {
    mockSignIn.mockResolvedValue({ ok: true, error: null });

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.submitLogin(VALID_DATA);
    });

    expect(mockSignIn).toHaveBeenCalledWith('credentials', {
      email: 'jane@example.com',
      password: 'Secure1!pass',
      role: 'patient',
      rememberMe: 'true',
      redirect: false,
    });
  });

  it('redirects to /dashboard on success', async () => {
    mockSignIn.mockResolvedValue({ ok: true, error: null });

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.submitLogin(VALID_DATA);
    });

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('shows a generic error toast on invalid credentials', async () => {
    mockSignIn.mockResolvedValue({ ok: false, error: 'CredentialsSignin' });

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.submitLogin(VALID_DATA);
    });

    expect(result.current.toast).toEqual({
      message: 'Invalid email or password.',
      variant: 'error',
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows a network error toast when signIn throws', async () => {
    mockSignIn.mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.submitLogin(VALID_DATA);
    });

    expect(result.current.toast).toEqual({
      message: 'Network error. Please check your connection and try again.',
      variant: 'error',
    });
  });

  it('allows dismissing the toast', async () => {
    mockSignIn.mockResolvedValue({ ok: false, error: 'CredentialsSignin' });

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.submitLogin(VALID_DATA);
    });

    expect(result.current.toast).not.toBeNull();

    act(() => {
      result.current.setToast(null);
    });

    expect(result.current.toast).toBeNull();
  });
});
