"use client";

import { usePathname } from "next/navigation";
import {
  MdAnalytics,
  MdDashboard,
  MdHealthAndSafety,
  MdPerson,
} from "react-icons/md";

import { PendingLink } from "@/components/ui/PendingLink";
import { LogoutButton } from "@/features/auth/components/LogoutButton";

type AdminPortalShellProps = {
  children: React.ReactNode;
  userEmail?: string | null;
  userName?: string | null;
};

const NAV = [
  { href: "/admin", label: "Dashboard", icon: MdDashboard },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: MdAnalytics,
  },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminPortalShell({
  children,
  userEmail,
  userName,
}: AdminPortalShellProps) {
  const pathname = usePathname();
  const displayName = userName || userEmail || "Admin";
  const initials = displayName
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="hm-portal-shell flex min-h-screen bg-[var(--color-background)] text-[var(--color-on-surface)]">
      <aside className="fixed left-0 z-20 hidden h-screen w-64 flex-col gap-[var(--spacing-hm-md)] border-r border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] px-[var(--spacing-hm-sm)] py-[var(--spacing-hm-lg)] md:flex">
        <PendingLink
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
              Admin Portal
            </p>
          </div>
        </PendingLink>

        <nav
          className="flex flex-1 flex-col gap-1"
          aria-label="Admin navigation"
        >
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <PendingLink
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 font-dm-sans text-label-md transition-colors ${
                  active
                    ? "bg-[var(--color-primary-container)]/20 font-semibold text-[var(--color-primary)]"
                    : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)]"
                }`}
              >
                <Icon size={20} aria-hidden />
                {item.label}
              </PendingLink>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-[var(--color-outline-variant)]/30 pt-[var(--spacing-hm-md)]">
          <div className="mb-[var(--spacing-hm-md)] flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-secondary-container)] font-dm-sans text-label-md font-bold text-[var(--color-primary)]">
              {initials || <MdPerson size={20} aria-hidden />}
            </div>
            <div className="min-w-0">
              <p className="truncate font-dm-sans text-label-md font-bold text-[var(--color-on-surface)]">
                {displayName}
              </p>
              <p className="font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
                Clinic Admin
              </p>
            </div>
          </div>
          <LogoutButton className="w-full" />
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col md:ml-64">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-4 py-3 md:hidden">
          <PendingLink
            href="/admin"
            className="font-dm-sans text-headline-md font-bold text-[var(--color-primary)]"
          >
            HealthMate Admin
          </PendingLink>
          <LogoutButton />
        </header>
        <main className="flex-1 px-[var(--spacing-hm-margin-mobile)] py-[var(--spacing-hm-xl)] md:px-[var(--spacing-hm-margin-desktop)]">
          {children}
        </main>

        <nav
          className="fixed right-0 bottom-0 left-0 z-30 flex items-center justify-around border-t border-[var(--color-outline-variant)]/30 bg-[var(--color-surface)] px-4 py-3 md:hidden"
          aria-label="Mobile navigation"
        >
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <PendingLink
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 transition-colors ${
                  active
                    ? "font-bold text-[var(--color-primary)]"
                    : "text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]"
                }`}
              >
                <Icon size={22} aria-hidden />
                <span className="font-dm-sans text-[10px]">{item.label}</span>
              </PendingLink>
            );
          })}
        </nav>
        <div className="h-20 md:hidden" aria-hidden />
      </div>
    </div>
  );
}
