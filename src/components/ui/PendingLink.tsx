"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  setNavigationPendingListener,
  signalRoutePending,
} from "@/components/ui/navigation-signal";

type NavigationBusyContextValue = {
  isBusy: boolean;
  navigate: (href: string) => void;
};

const NavigationBusyContext = createContext<NavigationBusyContextValue | null>(
  null,
);

/** Max time to keep the overlay if the destination never matches (stuck nav). */
const PENDING_SAFETY_MS = 12_000;

function normalizePath(href: string): string {
  try {
    const url = new URL(href, "http://local.invalid");
    return url.pathname;
  } catch {
    return href.split("?")[0]?.split("#")[0] || href;
  }
}

function pathsEqual(a: string, b: string): boolean {
  return normalizePath(a) === normalizePath(b);
}

export function NavigationBusyProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // Adjust state during render once the destination URL is active (React-recommended).
  if (pendingHref !== null && pathsEqual(pathname, pendingHref)) {
    setPendingHref(null);
  }

  const markPending = useCallback((href: string) => {
    setPendingHref(normalizePath(href));
  }, []);

  // Safety valve — never leave the overlay stuck forever.
  useEffect(() => {
    if (!pendingHref) return;
    const timeout = window.setTimeout(
      () => setPendingHref(null),
      PENDING_SAFETY_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [pendingHref]);

  useEffect(() => {
    setNavigationPendingListener((href) => {
      markPending(href);
    });
    return () => setNavigationPendingListener(null);
  }, [markPending]);

  // Catch every in-app link click (sidebar, page CTAs, breadcrumbs, etc.).
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
      if (/^https?:\/\//i.test(href) && !href.includes(window.location.host)) {
        return;
      }

      const nextPath = normalizePath(href);
      if (!nextPath.startsWith("/")) return;
      if (pathsEqual(nextPath, pathname)) return;

      markPending(nextPath);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname, markPending]);

  const navigate = useCallback(
    (href: string) => {
      const nextPath = normalizePath(href);
      if (pathsEqual(nextPath, pathname)) return;
      signalRoutePending(nextPath);
      startTransition(() => {
        router.push(href);
      });
    },
    [pathname, router],
  );

  const isBusy =
    isPending || (pendingHref !== null && !pathsEqual(pathname, pendingHref));

  return (
    <NavigationBusyContext.Provider value={{ isBusy, navigate }}>
      {isBusy && (
        <>
          <div className="hm-route-progress" role="status" aria-live="polite">
            <span className="sr-only">Loading page</span>
          </div>
          <div className="hm-route-overlay" aria-busy="true" aria-live="polite">
            <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-lowest)] px-6 py-5 shadow-lg">
              <LoadingSpinner size={28} label="Loading page" />
              <p className="font-dm-sans text-label-md font-bold text-[var(--color-primary)]">
                Loading…
              </p>
            </div>
          </div>
        </>
      )}
      {children}
    </NavigationBusyContext.Provider>
  );
}

export function useNavigationBusy(): NavigationBusyContextValue {
  const ctx = useContext(NavigationBusyContext);
  if (!ctx) {
    throw new Error(
      "useNavigationBusy must be used within NavigationBusyProvider",
    );
  }
  return ctx;
}

type PendingLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
};

/** App Link that drives the shared route progress overlay via controlled navigation. */
export function PendingLink({
  href,
  className,
  children,
  "aria-label": ariaLabel,
}: PendingLinkProps) {
  const { navigate, isBusy } = useNavigationBusy();
  const pathname = usePathname();
  const pendingHere = isBusy && href !== pathname;

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      aria-busy={pendingHere || undefined}
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        event.preventDefault();
        navigate(href);
      }}
      className={className}
    >
      {children}
    </Link>
  );
}
