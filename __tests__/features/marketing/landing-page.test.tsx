import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('opens and closes the mobile navigation menu', async () => {
    const user = userEvent.setup();
    render(<LandingPage />);

    await user.click(screen.getByRole('button', { name: /open menu/i }));

    const mobileMenu = document.getElementById('mobile-nav-menu');
    expect(mobileMenu).toBeDefined();
    expect(screen.getByRole('button', { name: /^close menu$/i })).toBeDefined();

    await user.click(
      screen.getByRole('button', { name: /dismiss navigation menu/i }),
    );
    expect(document.getElementById('mobile-nav-menu')).toBeNull();
  });
});
