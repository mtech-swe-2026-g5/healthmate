import { JSX } from "react";

export interface ModelProps {
  title: string;
  content: JSX.Element | string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => Promise<void>;
  onCancel?: () => Promise<void>;
}

export default function Model({
  title,
  content,
  isOpen,
  onConfirm,
  onCancel,
  onClose,
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

        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 z-10 transform transition-all">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>

            <button
              id="closeIconBtn"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition cursor-pointer text-2xl font-bold"
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
              )}
              {onConfirm && (
                <button
                  id="confirmModalBtn"
                  onClick={() => onConfirm().finally(onClose)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition cursor-pointer"
                >
                  Confirm
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
