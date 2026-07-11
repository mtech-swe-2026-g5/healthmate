import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: function MockImage(props: { alt: string }) {
    return <span role="img" aria-label={props.alt} />;
  },
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

import { LandingPage } from '@/features/marketing';

afterEach(() => {
  cleanup();
});

describe('LandingPage', () => {
  it('renders hero headline and primary actions', () => {
    render(<LandingPage />);

    expect(
      screen.getByRole('heading', {
        name: /healthcare scheduling, finally effortless/i,
      }),
    ).toBeDefined();
    expect(
      screen.getByRole('link', { name: /book an appointment/i }).getAttribute('href'),
    ).toBe('/register');
    expect(
      screen.getByRole('link', { name: /get started/i }).getAttribute('href'),
    ).toBe('/register');
  });

  it('renders feature and footer sections', () => {
    render(<LandingPage />);

    expect(
      screen.getByRole('heading', { name: /built for patients and clinics/i }),
    ).toBeDefined();
    expect(screen.getByText(/Patient Registration & Login/i)).toBeDefined();
    expect(screen.getByText(/Analytics & Insights/i)).toBeDefined();
    expect(
      screen.getByRole('heading', { name: /engineered for medical excellence/i }),
    ).toBeDefined();
    expect(screen.getByRole('heading', { name: /smart scheduling/i })).toBeDefined();
    expect(screen.getByRole('heading', { name: /automated reminders/i })).toBeDefined();
    expect(screen.getByRole('heading', { name: /conflict detection/i })).toBeDefined();
    expect(screen.getByText(/HIPAA COMPLIANT/i)).toBeDefined();
    expect(screen.getByText(/© 2026 HealthMate/i)).toBeDefined();
    expect(screen.getByText(/Trusted by 200\+ clinics nationwide/i)).toBeDefined();
  });

  it('shows sign-in actions when logged out', () => {
    render(<LandingPage />);

    expect(screen.getByRole('link', { name: /log in/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /get started/i })).toBeDefined();
    expect(screen.queryByRole('button', { name: /log out/i })).toBeNull();
  });

  it('shows dashboard + logout actions when logged in', () => {
    render(<LandingPage isLoggedIn />);

    // Nav dashboard link + hero "Go to Dashboard" both point at /dashboard.
    const dashboardLinks = screen
      .getAllByRole('link')
      .filter((el) => el.getAttribute('href') === '/dashboard');
    expect(dashboardLinks.length).toBeGreaterThan(0);

    expect(screen.getByRole('button', { name: /log out/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /go to dashboard/i })).toBeDefined();

    // Signed-in visitors should not see the sign-in / sign-up actions.
    expect(screen.queryByRole('link', { name: /^log in$/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /get started/i })).toBeNull();
  });
});
