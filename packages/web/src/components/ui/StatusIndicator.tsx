/**
 * StatusIndicator Component
 *
 * @description Connection status indicator showing Online/Offline/Syncing states
 * @requirements 3.4 Sync status indicator in application header
 *
 * @example
 * ```tsx
 * <StatusIndicator status="online" />
 * <StatusIndicator status="offline" />
 * <StatusIndicator status="syncing" />
 * <StatusIndicator status="error" />
 * ```
 */

import { twMerge } from 'tailwind-merge';
import type { SyncConnectionStatus } from '../../types/enums';

export interface StatusIndicatorProps {
  /** Current connection/sync status */
  status: SyncConnectionStatus;
  /** Whether to show the status label */
  showLabel?: boolean;
  /** Custom class name */
  className?: string;
  /** Size of the indicator */
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<
  SyncConnectionStatus,
  {
    label: string;
    dotClass: string;
    textClass: string;
    animation?: string;
  }
> = {
  online: {
    label: 'Online',
    dotClass: 'bg-green-500',
    textClass: 'text-green-700',
    animation: undefined,
  },
  offline: {
    label: 'Offline',
    dotClass: 'bg-red-500',
    textClass: 'text-red-700',
    animation: undefined,
  },
  syncing: {
    label: 'Syncing',
    dotClass: 'bg-primary-500',
    textClass: 'text-primary-700',
    animation: 'animate-pulse',
  },
  error: {
    label: 'Error',
    dotClass: 'bg-red-500',
    textClass: 'text-red-700',
    animation: undefined,
  },
};

const sizeConfig: Record<
  'sm' | 'md' | 'lg',
  {
    dot: string;
    text: string;
    gap: string;
    spinnerSize: string;
  }
> = {
  sm: {
    dot: 'w-2 h-2',
    text: 'text-xs',
    gap: 'gap-1.5',
    spinnerSize: 'w-3 h-3',
  },
  md: {
    dot: 'w-2.5 h-2.5',
    text: 'text-sm',
    gap: 'gap-2',
    spinnerSize: 'w-4 h-4',
  },
  lg: {
    dot: 'w-3 h-3',
    text: 'text-base',
    gap: 'gap-2.5',
    spinnerSize: 'w-5 h-5',
  },
};

/**
 * Spinner component for syncing state
 */
function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={twMerge('animate-spin text-primary-500', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Status dot component
 */
function StatusDot({
  status,
  size,
  className,
}: {
  status: SyncConnectionStatus;
  size: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const config = statusConfig[status];
  const sizeConf = sizeConfig[size];

  if (status === 'syncing') {
    return <Spinner className={twMerge(sizeConf.spinnerSize, className)} />;
  }

  return (
    <span
      className={twMerge(
        'rounded-full',
        sizeConf.dot,
        config.dotClass,
        config.animation,
        className
      )}
      aria-hidden="true"
    />
  );
}

export function StatusIndicator({
  status,
  showLabel = true,
  className,
  size = 'md',
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const sizeConf = sizeConfig[size];

  return (
    <div
      className={twMerge('flex items-center', sizeConf.gap, className)}
      role="status"
      aria-live="polite"
      aria-label={`Connection status: ${config.label}`}
    >
      <StatusDot status={status} size={size} />
      {showLabel && (
        <span className={twMerge('font-medium', sizeConf.text, config.textClass)}>
          {config.label}
        </span>
      )}
    </div>
  );
}

/**
 * Compact status indicator (dot only)
 */
export function StatusDotIndicator({
  status,
  size = 'md',
  className,
}: Omit<StatusIndicatorProps, 'showLabel'>) {
  return <StatusIndicator status={status} showLabel={false} size={size} className={className} />;
}

export default StatusIndicator;
