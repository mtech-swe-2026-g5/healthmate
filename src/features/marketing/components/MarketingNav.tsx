'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MdClose, MdMenu } from 'react-icons/md';

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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-outline-variant/30 bg-surface/80 backdrop-blur-md">
      <div
        className={`${marketingContainerClass} flex h-14 sm:h-16 items-center justify-between gap-2`}
      >
        <BrandMark className={`${marketingBrandLink} shrink-0`} />

        {/* Desktop nav links */}
        {/* Marketing section links are only relevant to signed-out visitors. */}
        {!isLoggedIn && (
          <div className="hidden items-center gap-hm-xl lg:flex">
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

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant/50 text-on-surface transition-colors hover:bg-surface-container lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <MdClose size={22} /> : <MdMenu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            aria-label="Dismiss navigation menu"
            onClick={() => setMenuOpen(false)}
          />
          <div
            id="mobile-nav-menu"
            className="fixed inset-x-0 top-14 z-50 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-outline-variant/30 bg-surface/95 backdrop-blur-md lg:hidden"
          >
            <div className={`${marketingContainerClass} flex flex-col gap-1 py-4`}>
              {marketingNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-lg px-3 py-3 font-dm-sans text-label-md ${
                    link.href === '#features'
                      ? 'font-bold text-primary bg-secondary-container/50'
                      : 'font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={authRoutes.login}
                onClick={() => setMenuOpen(false)}
                className={`${marketingButtonLogin} mt-2 w-full justify-center`}
              >
                Log in
              </Link>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
