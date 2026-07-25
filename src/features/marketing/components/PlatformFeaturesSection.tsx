import { AppIcon } from "@/components/ui/AppIcon";
import { platformFeatures } from "@/features/marketing/constants/landing-content";

import { MarketingContainer } from "./MarketingContainer";

export function PlatformFeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 py-hm-xxl">
      <MarketingContainer>
        <div className="mb-hm-xxl text-center">
          <h2 className="mb-hm-md font-dm-sans text-headline-lg text-on-surface">
            Built for patients and clinics
          </h2>
          <p className="mx-auto max-w-3xl font-literata text-body-md text-on-surface-variant">
            HealthMate brings together the core tools your practice needs—from
            sign-up and booking to reminders and reporting—in one calm, reliable
            platform.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-hm-lg sm:grid-cols-2 lg:grid-cols-3">
          {platformFeatures.map((feature) => (
            <article
              key={feature.title}
              className="bento-card rounded-xl border border-outline-variant bg-white p-hm-lg"
            >
              <AppIcon
                icon={feature.icon}
                className="mb-hm-md text-3xl text-primary-container"
              />
              <h3 className="mb-hm-sm font-dm-sans text-title-lg text-on-surface">
                {feature.title}
              </h3>
              <p className="font-literata text-body-md leading-relaxed text-on-surface-variant">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </MarketingContainer>
    </section>
  );
}
