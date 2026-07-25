'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MdCalendarMonth,
  MdDashboard,
  MdEvent,
  MdHealthAndSafety,
  MdPerson,
  MdSettings,
} from 'react-icons/md';

import { LogoutButton } from '@/features/auth/components/LogoutButton';

type PatientPortalShellProps = {
  children: React.ReactNode;
  userEmail?: string | null;
  userName?: string | null;
};

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: MdDashboard },
  { href: '/appointments', label: 'Appointments', icon: MdEvent, match: '/appointments' },
  { href: '/appointments/book', label: 'Schedule', icon: MdCalendarMonth },
  { href: '/profile', label: 'Settings', icon: MdSettings },
] as const;

function isActive(pathname: string, href: string, match?: string): boolean {
  if (href === '/appointments/book') {
    return pathname.startsWith('/appointments/book');
  }
  if (match === '/appointments') {
    return (
      pathname === '/appointments' ||
      (/^\/appointments\/[^/]+$/.test(pathname) &&
        !pathname.startsWith('/appointments/book'))
    );
  }
  if (href === '/profile') {
    return pathname === '/profile' || pathname.startsWith('/profile/');
  }
  return pathname === href;
}

export function PatientPortalShell({
  children,
  userEmail,
  userName,
}: PatientPortalShellProps) {
  const pathname = usePathname();
  const displayName = userName || userEmail || 'Patient';
  const initials = displayName
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="flex min-h-screen bg-[var(--color-background)] text-[var(--color-on-surface)]">
      <aside className="fixed left-0 z-20 hidden h-screen w-64 flex-col gap-[var(--spacing-hm-md)] border-r border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] px-[var(--spacing-hm-sm)] py-[var(--spacing-hm-lg)] md:flex">
        <Link
          href="/"
          className="mb-[var(--spacing-hm-xl)] flex items-center gap-2 px-[var(--spacing-hm-md)]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white">
            <MdHealthAndSafety size={22} aria-hidden />
          </div>
          <div>
            <p className="font-dm-sans text-headline-md font-bold text-[var(--color-primary)]">
              HealthMate
            </p>
            <p className="font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
              Patient Portal
            </p>
          </div>
        </Link>

        <nav className="flex flex-1 flex-col gap-1" aria-label="Patient navigation">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href, 'match' in item ? item.match : undefined);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-[var(--spacing-hm-md)] rounded-lg px-[var(--spacing-hm-md)] py-2 transition-all duration-200 ${
                  active
                    ? 'bg-[var(--color-secondary-container)] font-bold text-[var(--color-on-secondary-container)]'
                    : 'font-medium text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)]'
                }`}
              >
                <Icon size={22} aria-hidden />
                <span className="font-dm-sans text-label-md">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container)] p-[var(--spacing-hm-md)]">
          <Link
            href="/profile"
            className="mb-[var(--spacing-hm-md)] flex items-center gap-[var(--spacing-hm-md)] rounded-lg transition-colors hover:bg-[var(--color-surface-container-highest)]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-container)]/15 font-dm-sans text-label-md font-bold text-[var(--color-primary)]">
              {initials || <MdPerson size={20} />}
            </div>
            <div className="min-w-0">
              <p className="truncate font-dm-sans text-label-md font-bold text-[var(--color-on-surface)]">
                {displayName}
              </p>
              <p className="font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
                Patient
              </p>
            </div>
          </Link>
          <Link
            href="/appointments/book"
            className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] py-2 text-center font-dm-sans text-label-md text-white transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <MdCalendarMonth size={18} aria-hidden />
            New Appointment
          </Link>
          <LogoutButton className="w-full justify-center rounded-lg border border-[var(--color-outline-variant)] px-3 py-2 font-dm-sans text-label-md text-[var(--color-on-surface-variant)]" />
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:ml-64">
        <header className="sticky top-0 z-10 flex h-16 items-center border-b border-[var(--color-outline-variant)]/30 bg-[var(--color-surface)]/80 px-4 backdrop-blur-md md:px-8">
          <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between">
            <Link
              href="/"
              className="font-dm-sans text-headline-md font-bold text-[var(--color-primary)] md:hidden"
            >
              HealthMate
            </Link>
            <nav className="hidden items-center gap-8 md:flex" aria-label="Section">
              <Link
                href="/dashboard"
                className={`inline-flex items-center gap-1.5 font-dm-sans text-label-md ${
                  pathname === '/dashboard'
                    ? 'border-b-2 border-[var(--color-primary)] pb-1 font-bold text-[var(--color-primary)]'
                    : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]'
                }`}
              >
                <MdDashboard size={18} aria-hidden />
                Overview
              </Link>
              <Link
                href="/appointments"
                className={`inline-flex items-center gap-1.5 font-dm-sans text-label-md ${
                  pathname === '/appointments' ||
                  (/^\/appointments\/[^/]+$/.test(pathname) &&
                    !pathname.startsWith('/appointments/book'))
                    ? 'border-b-2 border-[var(--color-primary)] pb-1 font-bold text-[var(--color-primary)]'
                    : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]'
                }`}
              >
                <MdEvent size={18} aria-hidden />
                Booking Details
              </Link>
              <Link
                href="/appointments/book"
                className={`inline-flex items-center gap-1.5 font-dm-sans text-label-md ${
                  pathname.startsWith('/appointments/book')
                    ? 'border-b-2 border-[var(--color-primary)] pb-1 font-bold text-[var(--color-primary)]'
                    : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]'
                }`}
              >
                <MdCalendarMonth size={18} aria-hidden />
                Schedule
              </Link>
              <Link
                href="/profile"
                className={`inline-flex items-center gap-1.5 font-dm-sans text-label-md ${
                  pathname.startsWith('/profile')
                    ? 'border-b-2 border-[var(--color-primary)] pb-1 font-bold text-[var(--color-primary)]'
                    : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]'
                }`}
              >
                <MdSettings size={18} aria-hidden />
                Settings
              </Link>
            </nav>
            <Link
              href="/appointments/book"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 font-dm-sans text-label-md text-white transition-opacity hover:opacity-90 md:hidden"
            >
              <MdCalendarMonth size={16} aria-hidden />
              Book
            </Link>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-[var(--spacing-hm-lg)] p-4 md:p-8">
          {children}
        </div>

        <nav
          className="fixed right-0 bottom-0 left-0 z-30 flex items-center justify-around border-t border-[var(--color-outline-variant)]/30 bg-[var(--color-surface)] px-4 py-3 md:hidden"
          aria-label="Mobile navigation"
        >
          {NAV.map((item) => {
            const active = isActive(pathname, item.href, 'match' in item ? item.match : undefined);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 transition-colors ${
                  active
                    ? 'font-bold text-[var(--color-primary)]'
                    : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]'
                }`}
              >
                <Icon size={22} aria-hidden />
                <span className="font-dm-sans text-[10px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="h-20 md:hidden" aria-hidden />
      </div>
    </div>
  );
}
