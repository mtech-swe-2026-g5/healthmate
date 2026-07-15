const INPUT_BASE =
  "peer w-full h-14 px-[var(--spacing-hm-md)] pt-2 border rounded-lg outline-none transition-all font-literata text-body-md text-[var(--color-on-surface)] bg-[var(--color-surface-container-lowest)]";

const INPUT_FOCUS =
  "focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]";

const INPUT_NORMAL = `${INPUT_BASE} border-[var(--color-outline-variant)] ${INPUT_FOCUS}`;
const INPUT_ERROR = `${INPUT_BASE} border-[var(--color-error)] focus:ring-[var(--color-error)]/20 focus:border-[var(--color-error)]`;

const SELECT_BASE =
  "w-full h-14 px-[var(--spacing-hm-md)] border rounded-lg outline-none transition-all font-literata text-body-md text-[var(--color-on-surface)] bg-[var(--color-surface-container-lowest)] appearance-none";

export function inputClass(hasError: boolean): string {
  return hasError ? INPUT_ERROR : INPUT_NORMAL;
}

export function selectClass(hasError: boolean): string {
  return `${SELECT_BASE} ${
    hasError
      ? "border-[var(--color-error)] focus:ring-[var(--color-error)]/20 focus:border-[var(--color-error)]"
      : `border-[var(--color-outline-variant)] ${INPUT_FOCUS}`
  }`;
}
