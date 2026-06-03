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
    expect(screen.getByRole('button', { name: /book an appointment/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /get started/i })).toBeDefined();
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
});
