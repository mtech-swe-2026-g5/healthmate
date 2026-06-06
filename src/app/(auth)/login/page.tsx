import type { Metadata } from 'next';
import Link from 'next/link';

import { BrandMark } from '@/components/ui/BrandMark';

export const metadata: Metadata = {
  title: 'Log In — HealthMate',
  description: 'Log in to your HealthMate account.',
};

export default function LoginPage() {
  return (
    <>
      {/* Brand anchor */}
      <div className="mb-[var(--spacing-hm-md)] sm:mb-[var(--spacing-hm-xl)]">
        <BrandMark variant="badge" href="/" className="mb-[var(--spacing-hm-md)] sm:mb-[var(--spacing-hm-lg)]" />
        <h1 className="font-dm-sans text-headline-responsive text-[var(--color-on-surface)] mb-[var(--spacing-hm-xs)]">
          Welcome back
        </h1>
        <p className="font-literata text-body-md text-[var(--color-on-surface-variant)]">
          Access your healthcare dashboard securely.
        </p>
      </div>

      <div className="py-8 sm:py-12 text-center">
        <p className="font-literata text-body-md text-[var(--color-on-surface-variant)] mb-6">
          Login functionality is coming soon.
        </p>
        <Link
          href="/register"
          className="inline-flex h-12 sm:h-14 w-full sm:w-auto items-center justify-center px-6 sm:px-8 bg-[var(--color-primary)] text-white rounded-lg font-dm-sans text-label-md font-bold hover:bg-[var(--color-primary-container)] transition-all active:scale-[0.98]"
        >
          Create an account
        </Link>
      </div>
    </>
  );
}
