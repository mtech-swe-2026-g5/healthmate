import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { LoginForm } from '@/features/auth/components/LoginForm';

const mockSubmitLogin = vi.fn();
let mockToast: { message: string; variant: 'success' | 'error' } | null = null;

vi.mock('@/features/auth/hooks', () => ({
  useLogin: () => ({
    toast: mockToast,
    setToast: vi.fn(),
    submitLogin: mockSubmitLogin,
  }),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToast = null;
  });

  afterEach(() => {
    cleanup();
  });

  it('renders email, password, and remember me fields', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email address/i)).toBeDefined();
    expect(document.getElementById('password')).toBeDefined();
    expect(screen.getByRole('checkbox', { name: /remember me/i })).toBeDefined();
  });

  it('does not render a doctor/patient role selector', () => {
    render(<LoginForm />);

    expect(screen.queryByRole('radio', { name: /patient/i })).toBeNull();
    expect(screen.queryByRole('radio', { name: /doctor/i })).toBeNull();
  });

  it('renders the submit button and sign-up link', () => {
    render(<LoginForm />);

    expect(screen.getByRole('button', { name: /log in/i })).toBeDefined();
    const link = screen.getByRole('link', { name: /sign up/i });
    expect(link.getAttribute('href')).toBe('/register');
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const passwordInput = document.getElementById('password') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    await user.click(screen.getByRole('button', { name: /^show password$/i }));
    expect(passwordInput.type).toBe('text');

    await user.click(screen.getByRole('button', { name: /^hide password$/i }));
    expect(passwordInput.type).toBe('password');
  });

  it('shows validation errors when submitting an empty form', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: /log in/i }));

    const alerts = await screen.findAllByRole('alert');
    expect(alerts.length).toBeGreaterThan(0);
    expect(mockSubmitLogin).not.toHaveBeenCalled();
  });

  it('submits valid credentials with remember me', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email address/i), 'jane@example.com');
    await user.type(document.getElementById('password') as HTMLInputElement, 'Secret1!');
    await user.click(screen.getByRole('checkbox', { name: /remember me/i }));
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(mockSubmitLogin).toHaveBeenCalledTimes(1);
    expect(mockSubmitLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'jane@example.com',
        password: 'Secret1!',
        rememberMe: true,
      }),
    );
  });

  it('renders an error toast from the hook', () => {
    mockToast = { message: 'Invalid email or password.', variant: 'error' };
    render(<LoginForm />);

    expect(screen.getByText('Invalid email or password.')).toBeDefined();
  });

  it('renders HealthMate branding', () => {
    render(<LoginForm />);

    expect(screen.getByText('HealthMate')).toBeDefined();
    expect(screen.getByText('Welcome back')).toBeDefined();
  });
});
