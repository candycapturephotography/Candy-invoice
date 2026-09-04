/**
 * UI Components Index
 *
 * This file exports all shared UI components for the CandyCapture Photography
 * Invoice Application.
 */

// Form components
export { Input } from './Input';
export type { InputProps } from './Input';

export { Select } from './Select';
export type { SelectProps, SelectOption } from './Select';

export { Checkbox } from './Checkbox';
export type { CheckboxProps } from './Checkbox';

export { Toggle } from './Toggle';
export type { ToggleProps } from './Toggle';

export { DatePicker, DateRangePicker } from './DatePicker';
export type { DatePickerProps, DateRangePickerProps } from './DatePicker';

// Toast notifications
export {
  ToastProvider,
  ToastContext,
  useToast,
} from './Toast';
export type { Toast, ToastVariant } from './Toast';

// Modal dialogs
export { Modal, ConfirmModal } from './Modal';
export type { ModalProps, ConfirmModalProps } from './Modal';

// Loading indicators
export {
  LoadingSpinner,
  LoadingOverlay,
  ButtonSpinner,
  Skeleton,
} from './LoadingSpinner';
export type {
  LoadingSpinnerProps,
  LoadingOverlayProps,
  ButtonSpinnerProps,
  SkeletonProps,
} from './LoadingSpinner';

// Error handling
export {
  ErrorBoundary,
  ErrorFallback,
  withErrorBoundary,
} from './ErrorBoundary';
export type {
  ErrorBoundaryProps,
  ErrorBoundaryState,
  ErrorFallbackProps,
} from './ErrorBoundary';

// Data display components
export { DataTable } from './DataTable';
export type { ColumnDef, DataTableProps, SortState, SortDirection } from './DataTable';

export {
  Badge,
  PaymentStatusBadge,
  SyncStatusBadge,
  getPaymentStatusVariant,
  getPaymentStatusLabel,
  getSyncStatusVariant,
  getSyncStatusLabel,
} from './Badge';
export type {
  BadgeProps,
  BadgeVariant,
  PaymentStatusBadgeProps,
  SyncStatusBadgeProps,
} from './Badge';

export { StatusIndicator, StatusDotIndicator } from './StatusIndicator';
export type { StatusIndicatorProps } from './StatusIndicator';

export { Pagination } from './Pagination';
export type { PaginationProps } from './Pagination';
