import { AppIcon } from '@/components/ui/AppIcon';
import { socialProofClinics } from '@/features/marketing/constants/landing-content';

import { MarketingContainer } from './MarketingContainer';

export function SocialProofSection() {
  return (
    <section className="bg-surface-container-low py-hm-xl">
      <MarketingContainer>
        <p className="mb-hm-lg text-center font-dm-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-70">
          Trusted by 200+ clinics nationwide
        </p>
        <div className="flex flex-wrap items-center justify-center gap-hm-xxl opacity-50 grayscale transition-all duration-500 hover:grayscale-0">
          {socialProofClinics.map((clinic) => (
            <div
              key={clinic.name}
              className="flex items-center gap-hm-sm font-dm-sans text-headline-md text-on-surface"
            >
              <AppIcon icon={clinic.icon} className="text-2xl" />
              {clinic.name}
            </div>
          ))}
        </div>
      </MarketingContainer>
    </section>
  );
}
