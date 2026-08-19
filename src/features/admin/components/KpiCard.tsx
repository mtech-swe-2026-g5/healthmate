import type { IconType } from "react-icons";

type KpiCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon: IconType;
  tone?: "primary" | "error";
};

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
}: KpiCardProps) {
  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-[var(--color-outline-variant)] bg-white p-5 shadow-sm transition-shadow hover:shadow-md lg:p-6">
      <div className="mb-3 flex items-start justify-between">
        <span className="font-dm-sans text-label-md uppercase tracking-wider text-[var(--color-on-surface-variant)]">
          {label}
        </span>
        <span
          className={`rounded-lg p-1 ${
            tone === "error"
              ? "bg-[var(--color-error)]/10 text-[var(--color-error)]"
              : "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
          }`}
        >
          <Icon size={20} aria-hidden />
        </span>
      </div>
      <p className="font-dm-sans text-headline-lg font-bold text-[var(--color-on-surface)]">
        {value}
      </p>
      {hint ? (
        <p className="mt-2 font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
