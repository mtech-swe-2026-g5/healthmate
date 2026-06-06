import { MdMedicalServices } from 'react-icons/md';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/*
       * Override root-layout's `html { height:100% }` and `body { display:flex }`
       * so auth pages scroll natively on mobile.
       * On desktop the auth-page-shell re-introduces flex centering via its own CSS.
       */}
      <style>{`
        html { height: auto !important; min-height: 100%; }
        body { display: block !important; min-height: 100dvh; min-height: 100vh; }
      `}</style>

      <div className="auth-body-bg auth-page-shell">
        {/* Card — full-width on mobile, max 1100px centered on desktop */}
        <main className="w-full max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-[2fr_3fr] bg-[var(--color-surface-container-lowest)] rounded-xl overflow-hidden auth-custom-shadow border border-[var(--color-outline-variant)]/30">
          {/* Left: Abstract pattern panel — desktop only */}
          <section
            className="hidden lg:flex relative auth-pattern-bg min-h-[400px]"
            aria-hidden="true"
          >
            <div className="absolute inset-0 bg-[var(--color-primary)]/20 backdrop-blur-[2px]" />
            <div className="relative h-full flex flex-col justify-end p-[var(--spacing-hm-lg)] xl:p-[var(--spacing-hm-xl)] z-10">
              <div className="mb-[var(--spacing-hm-md)] xl:mb-[var(--spacing-hm-lg)]">
                <MdMedicalServices
                  className="text-[var(--color-on-primary-container)] opacity-40"
                  size={48}
                />
              </div>
              <h2 className="font-dm-sans text-headline-responsive text-white mb-[var(--spacing-hm-sm)]">
                Care coordination made effortless.
              </h2>
              <p className="font-literata text-body-md xl:text-body-lg text-[var(--color-primary-fixed)] opacity-90">
                Experience a clinical management system designed with human-centric
                precision and modern simplicity.
              </p>
            </div>
          </section>

          {/* Right: Form content — grows with content, no height constraint */}
          <section className="auth-form-panel p-[var(--spacing-hm-md)] sm:p-[var(--spacing-hm-lg)] lg:p-[var(--spacing-hm-xl)] xl:p-[var(--spacing-hm-xxl)]">
            {children}
          </section>
        </main>

        <footer className="w-full max-w-[1100px] mx-auto mt-[var(--spacing-hm-md)] text-center">
          <p className="text-label-sm text-[var(--color-on-surface-variant)]/60">
            &copy; {new Date().getFullYear()} HealthMate. HIPAA Compliant.
            Professional Medical Software.
          </p>
        </footer>
      </div>
    </>
  );
}
