import { useEffect, type ReactNode, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';

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

function ModalContent({ children, className = '' }: ModalContentProps) {
  const classes = [
    'relative rounded-xl bg-card p-5 border-glow shadow-2xl animate-fade-in max-w-lg w-full',
    className,
  ]
    .filter(Boolean)
    .join(' ');

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

function ModalFooter({ children, className = '' }: ModalFooterProps) {
  const classes = ['flex justify-end gap-2 pt-4 border-t border-white/5', className]
    .filter(Boolean)
    .join(' ');
  return <div className={classes}>{children}</div>;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const overlayClasses = [
    'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 transition-pulse',
  ].join(' ');

  const modalContent = (
    <div className={overlayClasses} onClick={onClose} data-testid="modal-overlay">
      <ModalContent>
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md opacity-50 hover:opacity-100 hover:bg-white/5 transition-pulse focus:outline-none"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
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
        <div className="text-sm">{children}</div>
      </ModalContent>
    </div>
  );

  return createPortal(modalContent, document.body);
}

Modal.Content = ModalContent;
Modal.Footer = ModalFooter;
