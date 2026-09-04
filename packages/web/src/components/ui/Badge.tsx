/**
 * Badge Component
 *
 * @description Status badge with variants for payment status and sync status
 * @requirements 1.15 Payment status badge colors
 * @requirements 3.4 Sync status indicator
 *
 * @example
 * ```tsx
 * // Payment status badges
 * <Badge variant="pending">PENDING</Badge>
 * <Badge variant="partial">PARTIALLY PAID</Badge>
 * <Badge variant="paid">PAID</Badge>
 *
 * // Sync status badges
 * <Badge variant="synced">Synced</Badge>
 * <Badge variant="syncPending">Pending</Badge>
 * <Badge variant="syncError">Error</Badge>
 * ```
 */

import { twMerge } from 'tailwind-merge';
import type { PaymentStatus, SyncStatus } from '../../types/enums';

export type BadgeVariant =
  | 'pending' // Payment: PENDING - Orange/Amber (#FF9800)
  | 'partial' // Payment: PARTIALLY_PAID - Yellow (#FFC107)
  | 'paid' // Payment: PAID - Green (#4CAF50)
  | 'synced' // Sync: synced - Green
  | 'syncPending' // Sync: pending - Yellow
  | 'syncError' // Sync: error - Red
  | 'default'; // Default gray

export interface BadgeProps {
  /** Badge variant controlling colors */
  variant?: BadgeVariant;
  /** Badge content */
  children: React.ReactNode;
  /** Custom class name */
  className?: string;
  /** Badge size */
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles: Record<BadgeVariant, string> = {
  // Payment status colors (matching requirements)
  pending: 'bg-status-pending text-white', // Orange/Amber #FF9800
  partial: 'bg-status-partial text-surface-900', // Yellow #FFC107
  paid: 'bg-status-paid text-white', // Green #4CAF50

  // Sync status colors
  synced: 'bg-green-500 text-white',
  syncPending: 'bg-yellow-500 text-surface-900',
  syncError: 'bg-red-500 text-white',

  // Default
  default: 'bg-surface-200 text-surface-700',
};

const sizeStyles: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

/**
 * Maps PaymentStatus to Badge variant
 */
export function getPaymentStatusVariant(status: PaymentStatus): BadgeVariant {
  switch (status) {
    case 'PENDING':
      return 'pending';
    case 'PARTIALLY_PAID':
      return 'partial';
    case 'PAID':
      return 'paid';
    default:
      return 'default';
  }
}

/**
 * Maps PaymentStatus to display label
 */
export function getPaymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case 'PENDING':
      return 'PENDING';
    case 'PARTIALLY_PAID':
      return 'PARTIALLY PAID';
    case 'PAID':
      return 'PAID';
    default:
      return status;
  }
}

/**
 * Maps SyncStatus to Badge variant
 */
export function getSyncStatusVariant(status: SyncStatus): BadgeVariant {
  switch (status) {
    case 'synced':
      return 'synced';
    case 'pending':
      return 'syncPending';
    case 'error':
      return 'syncError';
    default:
      return 'default';
  }
}

/**
 * Maps SyncStatus to display label
 */
export function getSyncStatusLabel(status: SyncStatus): string {
  switch (status) {
    case 'synced':
      return 'Synced';
    case 'pending':
      return 'Pending';
    case 'error':
      return 'Error';
    default:
      return status;
  }
}

export function Badge({ variant = 'default', children, className, size = 'md' }: BadgeProps) {
  return (
    <span
      className={twMerge(
        'inline-flex items-center justify-center font-semibold rounded-full whitespace-nowrap',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Convenience component for Payment Status Badge
 */
export interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PaymentStatusBadge({ status, size = 'md', className }: PaymentStatusBadgeProps) {
  return (
    <Badge variant={getPaymentStatusVariant(status)} size={size} className={className}>
      {getPaymentStatusLabel(status)}
    </Badge>
  );
}

/**
 * Convenience component for Sync Status Badge
 */
export interface SyncStatusBadgeProps {
  status: SyncStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SyncStatusBadge({ status, size = 'sm', className }: SyncStatusBadgeProps) {
  return (
    <Badge variant={getSyncStatusVariant(status)} size={size} className={className}>
      {getSyncStatusLabel(status)}
    </Badge>
  );
}

export default Badge;
