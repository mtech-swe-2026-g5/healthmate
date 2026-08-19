import { JSX } from "react";

import { LoadingSpinner } from "./LoadingSpinner";

export type ModelConfirmVariant = "primary" | "danger";

export interface ModelProps {
  title: string;
  content: JSX.Element | string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => Promise<void>;
  onCancel?: () => Promise<void>;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` for destructive confirmations (e.g. cancelling an appointment). */
  confirmVariant?: ModelConfirmVariant;
  /** Disables both actions and shows a spinner while an in-flight request settles. */
  busy?: boolean;
  /** Confirm-button text while `busy`. Falls back to `confirmLabel`. */
  busyLabel?: string;
}

const CONFIRM_VARIANT_STYLES: Record<ModelConfirmVariant, string> = {
  primary: "bg-blue-600 hover:bg-blue-700",
  danger: "bg-[var(--color-error)] hover:opacity-90",
};

export default function Model({
  title,
  content,
  isOpen,
  onConfirm,
  onCancel,
  onClose,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "primary",
  busy = false,
  busyLabel,
}: ModelProps) {
  return (
    <>
      <div
        id="modalContainer"
        className={`fixed inset-0 z-50 items-center justify-center ${!isOpen ? "hidden" : "flex"}`}
      >
        <div
          id="modalOverlay"
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        ></div>

        <div className="relative bg-white rounded-xl shadow-xl w-[calc(100%-2rem)] sm:max-w-md p-6 z-10 transform transition-all">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>

            <button
              id="closeIconBtn"
              onClick={onClose}
              disabled={busy}
              className="text-gray-400 hover:text-gray-600 transition cursor-pointer text-2xl font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              &times;
            </button>
          </div>

          <div className="py-4 text-gray-600">{content}</div>

          {(onCancel || onConfirm) && (
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
              {onCancel && (
                <button
                  id="cancelModalBtn"
                  onClick={() => onCancel().finally(onClose)}
                  disabled={busy}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cancelLabel}
                </button>
              )}
              {onConfirm && (
                <button
                  id="confirmModalBtn"
                  onClick={() => onConfirm().finally(onClose)}
                  disabled={busy}
                  aria-busy={busy || undefined}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${CONFIRM_VARIANT_STYLES[confirmVariant]}`}
                >
                  {busy && <LoadingSpinner size={14} onDark label="Working" />}
                  {busy ? (busyLabel ?? confirmLabel) : confirmLabel}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
