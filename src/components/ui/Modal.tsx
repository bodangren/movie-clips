import { useEffect, type ReactNode, type MouseEvent } from "react";
import { createPortal } from "react-dom";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export interface ModalContentProps {
  children: ReactNode;
  className?: string;
}

export interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

function ModalContent({ children, className = "" }: ModalContentProps) {
  const classes = ["relative rounded-lg bg-background p-6 shadow-lg", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      onClick={(e: MouseEvent) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );
}

function ModalFooter({ children, className = "" }: ModalFooterProps) {
  const classes = ["flex justify-end gap-2 pt-4", className].filter(Boolean).join(" ");
  return <div className={classes}>{children}</div>;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const overlayClasses = [
    "fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4",
  ].join(" ");

  const modalContent = (
    <div
      className={overlayClasses}
      onClick={onClose}
      data-testid="modal-overlay"
    >
      <ModalContent>
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        )}
        {children}
      </ModalContent>
    </div>
  );

  return createPortal(modalContent, document.body);
}

Modal.Content = ModalContent;
Modal.Footer = ModalFooter;
