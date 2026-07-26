import { LoadingSpinner } from "./LoadingSpinner";
import { Skeleton } from "./Skeleton";

type LoadingStateProps = {
  label?: string;
  className?: string;
  /** Compact inline row vs centered block. */
  compact?: boolean;
};

export function LoadingState({
  label = "Loading…",
  className = "",
  compact = false,
}: LoadingStateProps) {
  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 font-literata text-body-md text-[var(--color-on-surface-variant)] ${className}`}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <LoadingSpinner size={16} label={label} />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-12 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <LoadingSpinner size={28} label={label} />
      <p className="font-literata text-body-md text-[var(--color-on-surface-variant)]">
        {label}
      </p>
    </div>
  );
}

type PageLoadingProps = {
  label?: string;
  variant?: "default" | "cards" | "form" | "calendar";
};

/** Route-level fallback used by `loading.tsx` files. */
export function PageLoading({
  label = "Loading…",
  variant = "default",
}: PageLoadingProps) {
  return (
    <div
      className="w-full space-y-[var(--spacing-hm-lg)] py-2"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <div className="flex items-center gap-3">
        <LoadingSpinner size={22} label={label} />
        <p className="font-dm-sans text-label-md font-bold text-[var(--color-primary)]">
          {label}
        </p>
      </div>

      {variant === "cards" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-48 w-full" />
          ))}
        </div>
      )}

      {variant === "form" && (
        <div className="space-y-4 rounded-xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-lowest)] p-6">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-2/3" />
          <Skeleton className="h-12 w-40" />
        </div>
      )}

      {variant === "calendar" && (
        <Skeleton className="h-[600px] w-full rounded-xl" />
      )}

      {variant === "default" && (
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}
    </div>
  );
}
