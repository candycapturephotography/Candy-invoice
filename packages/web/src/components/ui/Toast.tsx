import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';

/**
 * Toast notification component for displaying success/error/warning/info messages.
 * Implements Requirements 17.1 (error handling feedback) and 9.11 (loading indicators).
 */

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (
    message: string,
    variant?: ToastVariant,
    duration?: number
  ) => string;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Hook to access the toast context for showing notifications.
 * @returns ToastContextValue with methods to show/dismiss toasts
 * @throws Error if used outside ToastProvider
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * Generate a unique ID for each toast notification.
 */
function generateToastId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Default durations for toast variants in milliseconds.
 */
const DEFAULT_DURATIONS: Record<ToastVariant, number> = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 3000,
};

interface ToastProviderProps {
  children: React.ReactNode;
  /** Maximum number of toasts to display at once */
  maxToasts?: number;
}

/**
 * Provider component that manages toast state and renders the toast container.
 * Wrap your app with this provider to enable toast notifications.
 */
export function ToastProvider({
  children,
  maxToasts = 5,
}: ToastProviderProps): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (
      message: string,
      variant: ToastVariant = 'info',
      duration?: number
    ): string => {
      const id = generateToastId();
      const toastDuration = duration ?? DEFAULT_DURATIONS[variant];

      const newToast: Toast = {
        id,
        message,
        variant,
        duration: toastDuration,
      };

      setToasts((prev) => {
        // Remove oldest toasts if exceeding max limit
        const updated = [...prev, newToast];
        if (updated.length > maxToasts) {
          const removed = updated.slice(0, updated.length - maxToasts);
          removed.forEach((t) => {
            const timer = timersRef.current.get(t.id);
            if (timer) {
              clearTimeout(timer);
              timersRef.current.delete(t.id);
            }
          });
          return updated.slice(-maxToasts);
        }
        return updated;
      });

      // Set auto-dismiss timer if duration is provided
      if (toastDuration > 0) {
        const timer = setTimeout(() => {
          dismissToast(id);
        }, toastDuration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [maxToasts, dismissToast]
  );

  const clearAllToasts = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    setToasts([]);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  return (
    <ToastContext.Provider
      value={{ toasts, showToast, dismissToast, clearAllToasts }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

/**
 * Container component that renders all active toasts.
 * Positioned at the top-right of the viewport.
 */
function ToastContainer({
  toasts,
  onDismiss,
}: ToastContainerProps): JSX.Element | null {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed right-4 top-4 z-50 flex flex-col gap-2"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

/**
 * Individual toast notification component.
 */
function ToastItem({ toast, onDismiss }: ToastItemProps): JSX.Element {
  const variantStyles: Record<ToastVariant, string> = {
    success:
      'bg-status-paid text-white border-green-600',
    error:
      'bg-red-500 text-white border-red-600',
    warning:
      'bg-status-pending text-white border-orange-600',
    info: 'bg-primary-500 text-white border-primary-600',
  };

  const variantIcons: Record<ToastVariant, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div
      className={`flex min-w-[300px] max-w-md animate-slide-in items-center gap-3 rounded-lg border px-4 py-3 shadow-lg ${variantStyles[toast.variant]}`}
      role="alert"
      aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
    >
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
        {variantIcons[toast.variant]}
      </span>
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        aria-label="Dismiss notification"
        type="button"
      >
        ✕
      </button>
    </div>
  );
}

export { ToastContext };
