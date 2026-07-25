import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Schedule — HealthMate',
  description: 'Doctor schedule overview.',
};

export default function DoctorSchedulePage() {
  return (
    <div className="rounded-xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-lowest)] p-[var(--spacing-hm-xl)] auth-custom-shadow">
      <h1 className="font-dm-sans text-headline-lg text-[var(--color-on-surface)]">
        Schedule
      </h1>
      <p className="mt-[var(--spacing-hm-md)] font-literata text-body-md text-[var(--color-on-surface-variant)]">
        Your clinic schedule tools are coming soon. You will be able to review
        upcoming visits and availability here.
      </p>
    </div>
  );
}
