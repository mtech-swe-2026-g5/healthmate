import { siteConfig } from '@/config/site';
import {
  marketingButtonCtaFilled,
  marketingButtonCtaOutline,
} from '@/features/marketing/constants/interaction-styles';

import { MarketingContainer } from './MarketingContainer';

export function CtaSection() {
  return (
    <section id="pricing" className="scroll-mt-20 py-hm-xxl">
      <MarketingContainer>
        <div className="rounded-xl bg-primary p-hm-xxl text-center text-on-primary">
          <h2 className="mb-hm-md font-dm-sans text-headline-lg">
            Ready to modernize your clinic?
          </h2>
          <p className="mx-auto mb-hm-xl max-w-3xl font-literata text-body-lg opacity-90">
            Join hundreds of healthcare providers who trust {siteConfig.name} to handle their
            most critical operations.
          </p>
          <div className="flex flex-col justify-center gap-hm-md sm:flex-row">
            <button type="button" className={marketingButtonCtaFilled}>
              Start Free Trial
            </button>
            <button type="button" className={marketingButtonCtaOutline}>
              Schedule Demo
            </button>
          </div>
        </div>
      </MarketingContainer>
    </section>
  );
}
