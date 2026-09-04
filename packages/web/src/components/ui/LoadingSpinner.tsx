/**
 * LoadingSpinner component for displaying loading states.
 * Implements Requirements 9.11 (loading indicator during PDF generation)
 * and general loading feedback throughout the application.
 */

export interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Optional text to display below the spinner */
  text?: string;
  /** Color variant of the spinner */
  variant?: 'primary' | 'white' | 'surface';
  /** Whether to center the spinner in its container */
  centered?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Animated loading spinner with optional text.
 * Features:
 * - Multiple size options
 * - Color variants matching the app theme
 * - Optional descriptive text
 * - Accessible with proper ARIA attributes
 */
export function LoadingSpinner({
  size = 'md',
  text,
  variant = 'primary',
  centered = false,
  className = '',
}: LoadingSpinnerProps): JSX.Element {
  const sizeClasses = {
    sm: { spinner: 'h-4 w-4 border-2', text: 'text-xs' },
    md: { spinner: 'h-8 w-8 border-2', text: 'text-sm' },
    lg: { spinner: 'h-12 w-12 border-3', text: 'text-base' },
    xl: { spinner: 'h-16 w-16 border-4', text: 'text-lg' },
  } as const;

  const sizeConfig = sizeClasses[size];

  const variantClasses: Record<string, string> = {
    primary: 'border-primary-500/30 border-t-primary-500',
    white: 'border-white/30 border-t-white',
    surface: 'border-surface-300 border-t-surface-600',
  };

  const textColorClasses: Record<string, string> = {
    primary: 'text-primary-500',
    white: 'text-white',
    surface: 'text-surface-600',
  };

  const containerClasses = centered
    ? 'flex flex-col items-center justify-center'
    : 'inline-flex flex-col items-center';

  return (
    <div
      className={`${containerClasses} gap-3 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className={`animate-spin rounded-full ${sizeConfig.spinner} ${variantClasses[variant]}`}
        aria-hidden="true"
      />
      {text && (
        <span
          className={`${sizeConfig.text} ${textColorClasses[variant]} font-medium`}
        >
          {text}
        </span>
      )}
      <span className="sr-only">{text || 'Loading...'}</span>
    </div>
  );
}

/**
 * Full-page loading overlay for blocking operations.
 */
export interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  isVisible: boolean;
  /** Text to display */
  text?: string;
  /** Whether to use a transparent or opaque background */
  transparent?: boolean;
}

/**
 * Full-page loading overlay for blocking operations.
 * Covers the entire viewport with a centered spinner.
 */
export function LoadingOverlay({
  isVisible,
  text = 'Loading...',
  transparent = false,
}: LoadingOverlayProps): JSX.Element | null {
  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        transparent ? 'bg-white/80' : 'bg-surface-900/50'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-4 rounded-lg bg-white p-8 shadow-xl">
        <LoadingSpinner size="lg" variant="primary" />
        {text && (
          <p className="text-base font-medium text-surface-700">{text}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Inline loading state for buttons.
 */
export interface ButtonSpinnerProps {
  /** Size matching button size */
  size?: 'sm' | 'md';
  /** Color variant */
  variant?: 'white' | 'primary';
}

/**
 * Small spinner for use inside buttons.
 */
export function ButtonSpinner({
  size = 'sm',
  variant = 'white',
}: ButtonSpinnerProps): JSX.Element {
  const sizeClasses = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const colorClasses =
    variant === 'white'
      ? 'border-white/30 border-t-white'
      : 'border-primary-300 border-t-primary-500';

  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 ${sizeClasses} ${colorClasses}`}
      role="status"
      aria-hidden="true"
    >
      <span className="sr-only">Loading...</span>
    </span>
  );
}

/**
 * Skeleton loading placeholder for content.
 */
export interface SkeletonProps {
  /** Width of the skeleton */
  width?: string;
  /** Height of the skeleton */
  height?: string;
  /** Whether to use rounded corners */
  rounded?: boolean;
  /** Whether to use a circle shape */
  circle?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Skeleton loading placeholder for content while loading.
 */
export function Skeleton({
  width = '100%',
  height = '1rem',
  rounded = true,
  circle = false,
  className = '',
}: SkeletonProps): JSX.Element {
  return (
    <div
      className={`animate-pulse bg-surface-200 ${
        circle ? 'rounded-full' : rounded ? 'rounded' : ''
      } ${className}`}
      style={{
        width: circle ? height : width,
        height,
      }}
      role="presentation"
      aria-hidden="true"
    />
  );
}

export default LoadingSpinner;
