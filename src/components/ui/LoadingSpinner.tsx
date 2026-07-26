type LoadingSpinnerProps = {
  size?: number;
  className?: string;
  /** Use on primary/dark buttons where the spinner should be white. */
  onDark?: boolean;
  label?: string;
};

export function LoadingSpinner({
  size = 18,
  className = "",
  onDark = false,
  label = "Loading",
}: LoadingSpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label}
      className={`hm-spinner inline-block shrink-0 ${onDark ? "hm-spinner-on-dark" : ""} ${className}`}
      style={{ width: size, height: size, borderWidth: Math.max(2, size / 9) }}
    />
  );
}
