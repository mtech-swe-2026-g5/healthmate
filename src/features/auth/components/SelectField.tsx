import { FieldError } from './FieldError';

type SelectFieldProps = {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
};

export function SelectField({
  id,
  label,
  error,
  required,
  children,
}: SelectFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block font-dm-sans text-label-md text-[var(--color-on-surface-variant)] mb-1.5"
      >
        {label}
        {required && (
          <span className="text-[var(--color-error)]" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {children}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  );
}
