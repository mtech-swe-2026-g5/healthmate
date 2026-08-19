import { MdMedicalServices } from "react-icons/md";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-body-bg flex min-h-screen flex-col items-center justify-center p-[var(--spacing-hm-md)] md:p-[var(--spacing-hm-lg)]">
      <main className="auth-custom-shadow grid w-full max-w-[1100px] grid-cols-1 overflow-hidden rounded-xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-lowest)] md:grid-cols-[2fr_3fr]">
        <section
          className="auth-pattern-bg relative hidden md:block"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-[var(--color-primary)]/20 backdrop-blur-[2px]" />
          <div className="relative z-10 flex h-full flex-col justify-end p-[var(--spacing-hm-xl)]">
            <div className="mb-[var(--spacing-hm-lg)]">
              <MdMedicalServices
                className="text-[var(--color-on-primary-container)] opacity-40"
                size={48}
              />
            </div>
            <h2 className="mb-[var(--spacing-hm-sm)] font-dm-sans text-headline-lg text-white">
              Care coordination made effortless.
            </h2>
            <p className="font-literata text-body-lg text-[var(--color-primary-fixed)] opacity-90">
              Experience a clinical management system designed with
              human-centric precision and modern simplicity.
            </p>
          </div>
        </section>

        <section className="flex flex-col justify-center p-[var(--spacing-hm-xl)] md:p-[var(--spacing-hm-xxl)]">
          {children}
        </section>
      </main>

      <footer className="mt-6 w-full p-[var(--spacing-hm-md)] text-center">
        <p className="text-label-sm text-[var(--color-on-surface-variant)]/60">
          &copy; {new Date().getFullYear()} HealthMate. HIPAA Compliant.
          Professional Medical Software.
        </p>
      </footer>
    </div>
  );
}
