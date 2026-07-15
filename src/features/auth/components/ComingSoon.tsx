type ComingSoonProps = {
  role: string;
  email: string;
};
export default function ComingSoon({ role, email }: ComingSoonProps) {
  return (
    <div className="rounded-xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-lowest)] p-[var(--spacing-hm-xl)] auth-custom-shadow">
      <span className="inline-block rounded-full bg-[var(--color-primary)]/10 px-3 py-1 font-dm-sans text-label-sm uppercase tracking-wide text-[var(--color-primary)]">
        {role}
      </span>
      <h1 className="mt-[var(--spacing-hm-md)] font-dm-sans text-headline-lg text-[var(--color-on-surface)]">
        Welcome back
      </h1>
      <p className="mt-[var(--spacing-hm-xs)] font-literata text-body-md text-[var(--color-on-surface-variant)]">
        You are signed in as{" "}
        <span className="font-bold text-[var(--color-on-surface)]">
          {email}
        </span>
        . Your {role} dashboard is coming soon.
      </p>
    </div>
  );
}
