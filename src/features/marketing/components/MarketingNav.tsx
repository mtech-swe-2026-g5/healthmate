import Link from 'next/link';

import { BrandMark } from '@/components/ui/BrandMark';
import { LogoutButton } from '@/features/auth/components/LogoutButton';
import { authRoutes, marketingNavLinks } from '@/config/site';
import {
  marketingBrandLink,
  marketingButtonContainer,
  marketingButtonLogin,
  marketingNavLink,
  marketingNavLinkActive,
} from '@/features/marketing/constants/interaction-styles';
import { marketingContainerClass } from '@/features/marketing/constants/layout';

type MarketingNavProps = {
  isLoggedIn?: boolean;
};

export function MarketingNav({ isLoggedIn = false }: MarketingNavProps) {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-outline-variant/30 bg-surface/80 backdrop-blur-md">
      <div
        className={`${marketingContainerClass} flex h-16 items-center justify-between`}
      >
        <BrandMark className={marketingBrandLink} />

        {/* Marketing section links are only relevant to signed-out visitors. */}
        {!isLoggedIn && (
          <div className="hidden items-center gap-hm-xl md:flex">
            {marketingNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  link.href === '#features'
                    ? marketingNavLinkActive
                    : marketingNavLink
                }
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center gap-hm-md">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className={marketingButtonContainer}>
                Dashboard
              </Link>
              <LogoutButton
                className={`${marketingButtonLogin} hidden sm:inline-flex`}
              />
            </>
          ) : (
            <>
              <Link
                href={authRoutes.login}
                className={`${marketingButtonLogin} hidden sm:inline-flex`}
              >
                <span className="relative z-10 transition-all duration-200 ease-in-out group-hover:tracking-wide">
                  Log in
                </span>
              </Link>
              <Link
                href={authRoutes.register}
                className={marketingButtonContainer}
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
