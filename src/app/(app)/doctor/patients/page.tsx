import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Patients — HealthMate',
  description: 'Doctor patient list.',
};

export default function DoctorPatientsPage() {
  return (
    <div className="rounded-xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-lowest)] p-[var(--spacing-hm-xl)] auth-custom-shadow">
      <h1 className="font-dm-sans text-headline-lg text-[var(--color-on-surface)]">
        Patients
      </h1>
      <p className="mt-[var(--spacing-hm-md)] font-literata text-body-md text-[var(--color-on-surface-variant)]">
        Your patient roster tools are coming soon. You will be able to find and
        open patient records from here.
      </p>
    </div>
  );
}
