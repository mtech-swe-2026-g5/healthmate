type NavigationPendingListener = (href: string) => void;

let listener: NavigationPendingListener | null = null;

/** Used by NavigationBusyProvider to receive programmatic navigations. */
export function setNavigationPendingListener(
  next: NavigationPendingListener | null,
): void {
  listener = next;
}

/** Call before router.push/replace so the global loading overlay appears. */
export function signalRoutePending(href: string): void {
  listener?.(href);
}
