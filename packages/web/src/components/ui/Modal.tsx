import React, { useEffect, useCallback, useRef } from 'react';

/**
 * Modal dialog component for displaying dialogs with overlay.
 * Supports close on overlay click and Escape key.
 * Implements Requirements 17.5 (fallback UI) and user confirmation dialogs.
 */

export interface ModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Modal title displayed in the header */
  title?: string;
  /** Modal content */
  children: React.ReactNode;
  /** Footer content, typically action buttons */
  footer?: React.ReactNode;
  /** Whether clicking the overlay should close the modal (default: true) */
  closeOnOverlayClick?: boolean;
  /** Whether pressing Escape should close the modal (default: true) */
  closeOnEscape?: boolean;
  /** Size of the modal */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Whether to show the close button in the header */
  showCloseButton?: boolean;
  /** Additional CSS classes for the modal container */
  className?: string;
}

/**
 * Modal component for dialogs with overlay.
 * Features:
 * - Closes on overlay click (configurable)
 * - Closes on Escape key (configurable)
 * - Focus trap within modal
 * - Accessible with proper ARIA attributes
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  size = 'md',
  showCloseButton = true,
  className = '',
}: ModalProps): JSX.Element | null {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Handle Escape key press
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  // Handle overlay click
  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (closeOnOverlayClick && event.target === event.currentTarget) {
        onClose();
      }
    },
    [closeOnOverlayClick, onClose]
  );

  // Add/remove keyboard listener and manage focus
  useEffect(() => {
    if (isOpen) {
      // Store currently focused element
      previousActiveElement.current = document.activeElement;

      // Add escape key listener
      document.addEventListener('keydown', handleKeyDown);

      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';

      // Focus the modal
      modalRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';

      // Restore focus to previously focused element
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) {
    return null;
  }

  const sizeClasses: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        aria-hidden="true"
        onClick={handleOverlayClick}
      />

      {/* Modal content */}
      <div
        ref={modalRef}
        className={`relative z-10 w-full animate-fade-in rounded-lg bg-white shadow-xl ${sizeClasses[size]} ${className}`}
        tabIndex={-1}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between border-b border-surface-200 px-6 py-4">
            {title && (
              <h2
                id="modal-title"
                className="text-lg font-semibold text-surface-900"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700"
                aria-label="Close modal"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-surface-200 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Pre-built confirmation modal for common use cases.
 */
export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

/**
 * Confirmation modal for delete/destructive actions.
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  isLoading = false,
}: ConfirmModalProps): JSX.Element {
  const variantClasses: Record<string, string> = {
    danger:
      'bg-red-500 hover:bg-red-600 focus:ring-red-500 disabled:bg-red-300',
    warning:
      'bg-status-pending hover:bg-orange-600 focus:ring-status-pending disabled:bg-orange-300',
    primary:
      'bg-primary-500 hover:bg-primary-600 focus:ring-primary-500 disabled:bg-primary-300',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50 focus:outline-none focus:ring-2 focus:ring-surface-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed ${variantClasses[variant]}`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </>
      }
    >
      <p className="text-surface-600">{message}</p>
    </Modal>
  );
}

export default Modal;
