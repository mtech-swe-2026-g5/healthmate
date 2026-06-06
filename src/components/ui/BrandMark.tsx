import Link from 'next/link';
import { FaHospital } from 'react-icons/fa';

import { siteConfig } from '@/config/site';

type BrandMarkProps = {
  variant?: 'inline' | 'badge';
  className?: string;
  href?: string;
};

export function BrandMark({
  variant = 'inline',
  className,
  href = '/',
}: BrandMarkProps) {
  const content =
    variant === 'badge' ? (
      <div className="flex items-center gap-[var(--spacing-hm-sm)]">
        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-[var(--color-primary)]">
          <FaHospital className="text-white text-base sm:text-xl" aria-hidden />
        </div>
        <span className="font-dm-sans text-title-lg sm:text-headline-md font-bold text-[var(--color-primary)]">
          {siteConfig.name}
        </span>
      </div>
    ) : (
      <span className="inline-flex items-center gap-[var(--spacing-hm-sm)]">
        <FaHospital className="shrink-0 text-primary text-lg sm:text-[22px]" aria-hidden />
        <span>{siteConfig.name}</span>
      </span>
    );

  return (
    <Link
      href={href}
      className={`inline-block transition-opacity duration-200 ease-in-out hover:opacity-80 ${className ?? ''}`}
      aria-label={`${siteConfig.name} home`}
    >
      {content}
    </Link>
  );
}
