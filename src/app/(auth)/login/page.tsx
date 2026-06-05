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
      <div className="mb-[var(--spacing-hm-xl)]">
        <BrandMark variant="badge" href="/" className="mb-[var(--spacing-hm-lg)]" />
        <h1 className="font-dm-sans text-headline-lg text-[var(--color-on-surface)] mb-[var(--spacing-hm-xs)]">
          Welcome back
        </h1>
        <p className="font-literata text-body-md text-[var(--color-on-surface-variant)]">
          Access your healthcare dashboard securely.
        </p>
      </div>

      <div className="py-12 text-center">
        <p className="font-literata text-body-md text-[var(--color-on-surface-variant)] mb-6">
          Login functionality is coming soon.
        </p>
        <Link
          href="/register"
          className="inline-block h-14 px-8 leading-[56px] bg-[var(--color-primary)] text-white rounded-lg font-dm-sans text-label-md font-bold hover:bg-[var(--color-primary-container)] transition-all active:scale-[0.98]"
        >
          Create an account
        </Link>
      </div>
    </>
  );
}
