import React, { Component } from 'react';
import type { ErrorInfo } from 'react';

/**
 * ErrorBoundary component for catching React errors and displaying fallback UI.
 * Implements Requirements 17.5 (fallback screen with reload/dashboard options)
 * and 17.6 (error logging to backend).
 */

export interface ErrorBoundaryProps {
  /** Child components to render */
  children: React.ReactNode;
  /** Custom fallback UI component */
  fallback?: React.ReactNode;
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Whether to show the default fallback UI */
  showDefaultFallback?: boolean;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error boundary component that catches JavaScript errors in child components.
 * Displays a fallback UI with options to reload or navigate to dashboard.
 * 
 * Features:
 * - Catches rendering errors in child component tree
 * - Displays customizable fallback UI
 * - Logs errors for debugging
 * - Provides "Reload" and "Go to Dashboard" recovery options
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with error info
    this.setState({ errorInfo });

    // Log error details
    this.logError(error, errorInfo);

    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  /**
   * Log error details to console and optionally to backend.
   * Implements Requirement 17.6 (error logging).
   */
  private logError(error: Error, errorInfo: ErrorInfo): void {
    const errorLog = {
      type: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Log to console in development
    console.error('ErrorBoundary caught an error:', errorLog);

    // TODO: Send to backend logging service
    // This would be implemented when the API service is ready
    // apiService.logError(errorLog).catch(console.error);
  }

  /**
   * Reset the error state and attempt to re-render children.
   */
  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Reload the entire page.
   */
  private handleReload = (): void => {
    window.location.reload();
  };

  /**
   * Navigate to the dashboard.
   */
  private handleGoToDashboard = (): void => {
    window.location.href = '/';
  };

  override render(): React.ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, showDefaultFallback = true } = this.props;

    if (hasError) {
      // Custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      if (showDefaultFallback) {
        return (
          <ErrorFallback
            error={error}
            onReload={this.handleReload}
            onGoToDashboard={this.handleGoToDashboard}
            onRetry={this.handleReset}
          />
        );
      }

      // Minimal fallback if default is disabled
      return null;
    }

    return children;
  }
}

/**
 * Props for the ErrorFallback component.
 */
export interface ErrorFallbackProps {
  /** The error that was caught */
  error: Error | null;
  /** Callback to reload the page */
  onReload: () => void;
  /** Callback to navigate to dashboard */
  onGoToDashboard: () => void;
  /** Callback to retry rendering (resets error state) */
  onRetry?: () => void;
}

/**
 * Default fallback UI displayed when an error is caught.
 * Implements Requirement 17.5 (fallback screen with reload/dashboard options).
 */
export function ErrorFallback({
  error,
  onReload,
  onGoToDashboard,
  onRetry,
}: ErrorFallbackProps): JSX.Element {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-surface-50 p-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        {/* Error Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-8 w-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Error Title */}
        <h1 className="mb-2 text-center text-xl font-semibold text-surface-900">
          Something went wrong
        </h1>

        {/* Error Description */}
        <p className="mb-6 text-center text-surface-600">
          We're sorry, but an unexpected error occurred. Please try reloading
          the page or return to the dashboard.
        </p>

        {/* Error Details (development only) */}
        {isDevelopment && error && (
          <div className="mb-6 overflow-hidden rounded-lg bg-surface-100 p-4">
            <p className="mb-2 text-sm font-semibold text-red-600">
              {error.name}: {error.message}
            </p>
            {error.stack && (
              <pre className="max-h-40 overflow-auto text-xs text-surface-600">
                {error.stack}
              </pre>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onReload}
            className="w-full rounded-lg bg-primary-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Reload Page
          </button>
          <button
            type="button"
            onClick={onGoToDashboard}
            className="w-full rounded-lg border border-surface-300 bg-white px-4 py-3 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50 focus:outline-none focus:ring-2 focus:ring-surface-500 focus:ring-offset-2"
          >
            Go to Dashboard
          </button>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="w-full px-4 py-2 text-sm font-medium text-primary-500 transition-colors hover:text-primary-600 focus:outline-none"
            >
              Try Again
            </button>
          )}
        </div>
      </div>

      {/* Support Information */}
      <p className="mt-6 text-center text-sm text-surface-500">
        If this problem persists, please contact support.
      </p>
    </div>
  );
}

/**
 * Higher-order component to wrap a component with ErrorBoundary.
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithErrorBoundary = (props: P): JSX.Element => {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}

export default ErrorBoundary;
