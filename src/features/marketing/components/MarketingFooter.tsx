import Link from 'next/link';
import { MdLanguage, MdVerifiedUser } from 'react-icons/md';

import { AppIcon } from '@/components/ui/AppIcon';
import {
  footerDoctorLinks,
  footerLegalLinks,
  footerProductLinks,
  siteConfig,
} from '@/config/site';

import {
  marketingBrandLink,
  marketingFooterLink,
  marketingIconButton,
} from '@/features/marketing/constants/interaction-styles';

import { MarketingContainer } from './MarketingContainer';
import { ShareSiteButton } from './ShareSiteButton';

export function MarketingFooter() {
  return (
    <footer
      id="about"
      className="w-full scroll-mt-20 border-t border-outline-variant bg-surface-container-highest"
    >
      <MarketingContainer className="py-hm-xxl">
        <div className="grid grid-cols-1 gap-hm-xl sm:grid-cols-2 lg:grid-cols-5 lg:gap-hm-xl">
          <div className="space-y-hm-md sm:col-span-2 lg:col-span-2">
            <Link href="/" className={marketingBrandLink}>
              {siteConfig.brandMark} {siteConfig.name}
            </Link>
            <p className="max-w-md font-literata text-body-md text-on-surface-variant">
              Leading the transition to intelligent, patient-first healthcare scheduling
              since {siteConfig.copyrightYear}.
            </p>
            <div className="flex w-fit items-center gap-hm-sm rounded-full border border-outline-variant bg-surface-container-low px-hm-md py-hm-xs">
              <AppIcon icon={MdVerifiedUser} className="text-[18px] text-green-600" />
              <span className="font-dm-sans text-label-sm font-bold tracking-wide text-on-surface-variant">
                HIPAA COMPLIANT
              </span>
            </div>
          </div>

          <FooterLinkColumn title="Product" links={footerProductLinks} />
          <FooterLinkColumn title="For Doctors" links={footerDoctorLinks} />
          <FooterLinkColumn title="Legal" links={footerLegalLinks} />
        </div>

        <div className="mt-hm-xxl flex flex-col items-center justify-between gap-hm-md border-t border-outline-variant pt-hm-lg sm:flex-row">
          <p className="text-center font-dm-sans text-label-md text-on-surface-variant sm:text-left">
            © {siteConfig.copyrightYear} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex gap-hm-lg">
          <Link href="#" className={marketingIconButton} aria-label="Language">
            <AppIcon icon={MdLanguage} className="text-xl" />
          </Link>
            <ShareSiteButton />
          </div>
        </div>
      </MarketingContainer>
    </footer>
  );
}

type FooterLinkColumnProps = {
  title: string;
  links: ReadonlyArray<{ label: string; href: string }>;
};

function FooterLinkColumn({ title, links }: FooterLinkColumnProps) {
  return (
    <div>
      <h4 className="mb-hm-md font-dm-sans text-label-md font-bold text-on-surface">{title}</h4>
      <ul className="space-y-hm-md">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className={marketingFooterLink}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
