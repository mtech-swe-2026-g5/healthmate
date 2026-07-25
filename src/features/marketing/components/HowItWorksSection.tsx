import { howItWorksSteps } from "@/features/marketing/constants/landing-content";

import { MarketingContainer } from "./MarketingContainer";

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 bg-surface-container-highest py-hm-xxl"
    >
      <MarketingContainer>
        <div className="mb-hm-xxl text-center">
          <h2 className="mb-hm-md font-dm-sans text-headline-lg text-on-surface">
            Simplicity in Three Acts
          </h2>
        </div>

        <div className="relative grid grid-cols-1 gap-hm-xl md:grid-cols-3">
          <div className="absolute top-1/2 -z-10 hidden h-px w-full bg-outline-variant md:block" />

          {howItWorksSteps.map((item) => (
            <div
              key={item.step}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-hm-lg flex h-16 w-16 items-center justify-center rounded-full bg-primary font-dm-sans text-headline-md text-on-primary shadow-lg">
                {item.step}
              </div>
              <h3 className="mb-hm-sm font-dm-sans text-title-lg text-on-surface">
                {item.title}
              </h3>
              <p className="font-literata text-body-md text-on-surface-variant">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </MarketingContainer>
    </section>
  );
}
