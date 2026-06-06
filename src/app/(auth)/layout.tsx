import { MdMedicalServices } from 'react-icons/md';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-body-bg min-h-screen flex items-center justify-center p-[var(--spacing-hm-md)] md:p-[var(--spacing-hm-lg)]">
      <main className="w-full max-w-[1100px] grid grid-cols-1 md:grid-cols-[2fr_3fr] bg-[var(--color-surface-container-lowest)] rounded-xl overflow-hidden auth-custom-shadow border border-[var(--color-outline-variant)]/30">
        {/* Left: Abstract pattern panel */}
        <section className="hidden md:block relative auth-pattern-bg" aria-hidden="true">
          <div className="absolute inset-0 bg-[var(--color-primary)]/20 backdrop-blur-[2px]" />
          <div className="relative h-full flex flex-col justify-end p-[var(--spacing-hm-xl)] z-10">
            <div className="mb-[var(--spacing-hm-lg)]">
              <MdMedicalServices
                className="text-[var(--color-on-primary-container)] opacity-40"
                size={48}
              />
            </div>
            <h2 className="font-dm-sans text-headline-lg text-white mb-[var(--spacing-hm-sm)]">
              Care coordination made effortless.
            </h2>
            <p className="font-literata text-body-lg text-[var(--color-primary-fixed)] opacity-90">
              Experience a clinical management system designed with human-centric
              precision and modern simplicity.
            </p>
          </div>
        </section>

        {/* Right: Form content */}
        <section className="p-[var(--spacing-hm-xl)] md:p-[var(--spacing-hm-xxl)] flex flex-col justify-center">
          {children}
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 w-full p-[var(--spacing-hm-md)] text-center">
        <p className="text-label-sm text-[var(--color-on-surface-variant)]/60">
          &copy; {new Date().getFullYear()} HealthMate. HIPAA Compliant.
          Professional Medical Software.
        </p>
      </footer>
    </div>
  );
}
