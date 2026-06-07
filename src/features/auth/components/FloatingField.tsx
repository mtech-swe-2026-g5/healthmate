import { FieldError } from './FieldError';

type FloatingFieldProps = {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
};

export function FloatingField({
  id,
  label,
  error,
  required,
  children,
}: FloatingFieldProps) {
  return (
    <div>
      <div className={`floating-label-group ${error ? 'has-error' : ''}`}>
        {children}
        <label htmlFor={id} className="font-dm-sans text-label-md">
          {label}
          {required && (
            <span className="text-[var(--color-error)]" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
      </div>
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  );
}
