'use client';

import { useEffect, useState } from 'react';
import { MdCheckCircle, MdClose, MdError } from 'react-icons/md';

type ToastVariant = 'success' | 'error';

type ToastProps = {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose: () => void;
};

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success:
    'bg-[var(--color-surface-container-lowest,#fff)] border-[var(--color-primary)] text-[var(--color-on-surface)]',
  error:
    'bg-[var(--color-error-container)] border-[var(--color-error)] text-[var(--color-on-error-container,#93000a)]',
};

export function Toast({
  message,
  variant = 'success',
  duration = 4000,
  onClose,
}: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-lg border px-5 py-3 shadow-sm transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      } ${VARIANT_STYLES[variant]}`}
    >
      {variant === 'success' ? (
        <MdCheckCircle
          size={20}
          className="shrink-0 text-[var(--color-primary)]"
          aria-hidden
        />
      ) : (
        <MdError size={20} className="shrink-0 text-[var(--color-error)]" aria-hidden />
      )}
      <span className="text-body-md">{message}</span>
      <button
        type="button"
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }}
        className="ml-1 rounded-md p-1 text-[var(--color-on-surface-variant)] transition-colors duration-200 hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)]"
        aria-label="Dismiss notification"
      >
        <MdClose size={18} aria-hidden />
      </button>
    </div>
  );
}
