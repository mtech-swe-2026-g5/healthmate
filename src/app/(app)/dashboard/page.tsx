import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { MarketingNav } from '@/features/marketing';

export const metadata: Metadata = {
  title: 'Dashboard — HealthMate',
  description: 'Your HealthMate dashboard.',
};

export default async function DashboardPage() {
  const session = await auth();

  // Defence in depth: middleware already guards this route, but server
  // components must re-check the session before rendering protected UI.
  if (!session?.user) redirect('/login');

  const { email, role } = session.user;

  return (
    <div className="auth-body-bg min-h-screen">
      {/* Reuse the platform navbar for consistency (Dashboard + Log out). */}
      <MarketingNav isLoggedIn />

      <main className="mx-auto max-w-[800px] px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-xxl)]">
        <div className="rounded-xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-lowest)] p-[var(--spacing-hm-xl)] auth-custom-shadow">
          <span className="inline-block rounded-full bg-[var(--color-primary)]/10 px-3 py-1 font-dm-sans text-label-sm uppercase tracking-wide text-[var(--color-primary)]">
            {role}
          </span>
          <h1 className="mt-[var(--spacing-hm-md)] font-dm-sans text-headline-lg text-[var(--color-on-surface)]">
            Welcome back
          </h1>
          <p className="mt-[var(--spacing-hm-xs)] font-literata text-body-md text-[var(--color-on-surface-variant)]">
            You are signed in as{' '}
            <span className="font-bold text-[var(--color-on-surface)]">
              {email}
            </span>
            . Your {role} dashboard is coming soon.
          </p>
        </div>
      </main>
    </div>
  );
}
