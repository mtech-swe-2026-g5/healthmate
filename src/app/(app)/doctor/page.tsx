import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MdCalendarMonth, MdGroups } from 'react-icons/md';

import { auth } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Doctor dashboard — HealthMate',
  description: 'Your HealthMate doctor portal.',
};

export default async function DoctorDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { email, role } = session.user;

  return (
    <div className="rounded-xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-lowest)] p-[var(--spacing-hm-xl)] auth-custom-shadow">
      <span className="inline-block rounded-full bg-[var(--color-primary)]/10 px-3 py-1 font-dm-sans text-label-sm uppercase tracking-wide text-[var(--color-primary)]">
        {role}
      </span>
      <h1 className="mt-[var(--spacing-hm-md)] font-dm-sans text-headline-lg text-[var(--color-on-surface)]">
        Welcome back
      </h1>
      <p className="mt-[var(--spacing-hm-xs)] font-literata text-body-md text-[var(--color-on-surface-variant)]">
        You are signed in as{' '}
        <span className="font-bold text-[var(--color-on-surface)]">{email}</span>.
      </p>
      <p className="mt-[var(--spacing-hm-md)] font-literata text-body-md text-[var(--color-on-surface-variant)]">
        Use the sidebar to open your schedule and patient list. Clinical tools for
        those areas are coming soon.
      </p>
      <div className="mt-[var(--spacing-hm-xl)] flex flex-wrap gap-3">
        <Link
          href="/doctor/schedule"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-3 font-dm-sans text-label-md text-white transition-opacity duration-200 hover:opacity-90"
        >
          <MdCalendarMonth size={18} aria-hidden />
          View schedule
        </Link>
        <Link
          href="/doctor/patients"
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-outline-variant)] px-5 py-3 font-dm-sans text-label-md text-[var(--color-on-surface)] transition-colors duration-200 hover:bg-[var(--color-surface-container-high)]"
        >
          <MdGroups size={18} aria-hidden />
          Patients
        </Link>
      </div>
    </div>
  );
}
