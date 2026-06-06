import Link from 'next/link';

import { authRoutes, siteConfig } from '@/config/site';
import {
  marketingButtonCtaFilled,
  marketingButtonCtaOutline,
} from '@/features/marketing/constants/interaction-styles';

import { MarketingContainer } from './MarketingContainer';

export function CtaSection() {
  return (
    <section id="pricing" className="scroll-mt-20 section-py">
      <MarketingContainer>
        <div className="rounded-xl bg-primary p-hm-md sm:p-hm-lg md:p-hm-xxl text-center text-on-primary">
          <h2 className="mb-hm-md font-dm-sans text-headline-responsive">
            Ready to modernize your clinic?
          </h2>
          <p className="mx-auto mb-hm-lg sm:mb-hm-xl max-w-3xl font-literata text-body-md sm:text-body-lg opacity-90">
            Join hundreds of healthcare providers who trust {siteConfig.name} to handle their
            most critical operations.
          </p>
          <div className="flex flex-col justify-center gap-hm-md sm:flex-row sm:flex-wrap">
            <Link
              href={authRoutes.register}
              className={`${marketingButtonCtaFilled} w-full sm:w-auto`}
            >
              Start Free Trial
            </Link>
            <Link
              href={authRoutes.login}
              className={`${marketingButtonCtaOutline} w-full sm:w-auto`}
            >
              Schedule Demo
            </Link>
          </div>
        </div>
      </MarketingContainer>
    </section>
  );
}
