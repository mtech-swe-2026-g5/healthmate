'use client';

import { useEffect, useState } from 'react';

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
      className={`fixed inset-x-4 top-4 z-50 flex items-center gap-3 rounded-lg border px-4 py-3 shadow-sm transition-opacity duration-300 sm:inset-x-auto sm:right-6 sm:top-6 sm:max-w-md ${
        visible ? 'opacity-100' : 'opacity-0'
      } ${VARIANT_STYLES[variant]}`}
    >
      <span className="text-body-md">{message}</span>
      <button
        type="button"
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }}
        className="ml-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors duration-200"
        aria-label="Dismiss notification"
      >
        &times;
      </button>
    </div>
  );
}
