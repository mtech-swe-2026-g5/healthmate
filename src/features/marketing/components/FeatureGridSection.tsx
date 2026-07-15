import type { IconType } from "react-icons";

import { AppIcon } from "@/components/ui/AppIcon";
import { bentoFeatures } from "@/features/marketing/constants/landing-content";

import { MarketingContainer } from "./MarketingContainer";

const bentoCardBase =
  "bento-card flex h-full flex-col items-center justify-center text-center rounded-xl border border-outline-variant p-hm-lg";

type BentoCardContentProps = {
  icon: IconType;
  iconClassName: string;
  title: string;
  description: string;
  accent?: boolean;
  titleTag?: "h3" | "h4";
};

function BentoCardContent({
  icon,
  iconClassName,
  title,
  description,
  accent = false,
  titleTag: TitleTag = "h3",
}: BentoCardContentProps) {
  return (
    <>
      <AppIcon icon={icon} className={`mb-hm-md shrink-0 ${iconClassName}`} />
      <TitleTag
        className={`mb-hm-sm font-dm-sans text-title-lg ${accent ? "text-inherit" : "text-on-surface"}`}
      >
        {title}
      </TitleTag>
      <p
        className={
          accent
            ? "font-literata text-body-md leading-relaxed text-on-primary-container/80"
            : "font-literata text-body-md leading-relaxed text-on-surface-variant"
        }
      >
        {description}
      </p>
    </>
  );
}

export function FeatureGridSection() {
  const { large, accent, small } = bentoFeatures;

  return (
    <section id="capabilities" className="scroll-mt-20 py-hm-xxl">
      <MarketingContainer>
        <div className="mb-hm-xxl text-center">
          <h2 className="mb-hm-md font-dm-sans text-headline-lg text-on-surface">
            Engineered for Medical Excellence
          </h2>
          <p className="mx-auto max-w-3xl font-literata text-body-md text-on-surface-variant">
            Beyond just a calendar—a comprehensive ecosystem designed to
            optimize every touchpoint of the patient journey.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-hm-lg sm:grid-cols-2 lg:grid-cols-6 lg:items-stretch">
          <article
            className={`${bentoCardBase} bg-white sm:col-span-2 lg:col-span-3`}
          >
            <BentoCardContent
              icon={large.icon}
              iconClassName="text-[40px] text-primary-container"
              title={large.title}
              description={large.description}
            />
          </article>

          <article
            className={`${bentoCardBase} border-transparent bg-primary-container text-on-primary-container sm:col-span-2 lg:col-span-3`}
          >
            <BentoCardContent
              icon={accent.icon}
              iconClassName="text-[48px]"
              title={accent.title}
              description={accent.description}
              accent
            />
          </article>

          {small.map((feature) => (
            <article
              key={feature.title}
              className={`${bentoCardBase} bg-white sm:col-span-1 lg:col-span-2`}
            >
              <BentoCardContent
                icon={feature.icon}
                iconClassName="text-[32px] text-primary-container"
                title={feature.title}
                description={feature.description}
                titleTag="h4"
              />
            </article>
          ))}
        </div>
      </MarketingContainer>
    </section>
  );
}
