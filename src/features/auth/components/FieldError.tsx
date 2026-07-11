import { MdWarning } from 'react-icons/md';

type FieldErrorProps = {
  id: string;
  children: React.ReactNode;
};

export function FieldError({ id, children }: FieldErrorProps) {
  return (
    <p
      id={id}
      role="alert"
      className="mt-1 flex items-center gap-1 text-label-sm text-[var(--color-error)]"
    >
      <MdWarning size={14} className="shrink-0" />
      {children}
    </p>
  );
}
