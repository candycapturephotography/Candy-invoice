/**
 * CandyCapture Photography Invoice Application
 * DatePicker Component
 *
 * A date input component with calendar support and date range validation.
 * Uses pink/magenta (#E91E63) accent for focus states.
 *
 * Requirements: 14.5, 1.3 - Pink/magenta (#E91E63) accent styling
 * Requirements: 8.3, 8.4, 8.5 - Date handling and range support
 */

import { forwardRef, useId, useMemo } from 'react';
import type { InputHTMLAttributes, FC } from 'react';
import { cn } from '../../lib/utils';

export interface DatePickerProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** DatePicker label text */
  label?: string;
  /** Helper text displayed below the input */
  helperText?: string;
  /** Error message displayed when there's a validation error */
  error?: string;
  /** Whether the input has an error state */
  hasError?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Minimum selectable date (ISO format: YYYY-MM-DD) */
  minDate?: string;
  /** Maximum selectable date (ISO format: YYYY-MM-DD) */
  maxDate?: string;
  /** Full width mode */
  fullWidth?: boolean;
  /** Container class name */
  containerClassName?: string;
  /** Display format hint */
  formatHint?: string;
}

/**
 * Formats a Date object to ISO date string (YYYY-MM-DD)
 */
function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * DatePicker component with label, error state, and date range support
 * Uses pink/magenta (#E91E63) accent for focus states
 */
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      label,
      helperText,
      error,
      hasError,
      size = 'md',
      minDate,
      maxDate,
      fullWidth = false,
      containerClassName,
      className,
      disabled,
      required,
      id: providedId,
      'aria-describedby': ariaDescribedBy,
      formatHint,
      ...props
    },
    ref
  ) => {
    // Generate unique IDs for accessibility
    const generatedId = useId();
    const inputId = providedId || generatedId;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;

    // Determine if we should show error styling
    const showError = hasError || !!error;

    // Size classes
    const sizeClasses = {
      sm: 'h-8 text-sm px-2',
      md: 'h-10 text-base px-3',
      lg: 'h-12 text-lg px-4',
    };

    // Calculate default min/max dates based on requirements
    // Default: 1 year before to 2 years after current date
    const computedMinDate = useMemo(() => {
      if (minDate) return minDate;
      const date = new Date();
      date.setFullYear(date.getFullYear() - 1);
      return formatDateToISO(date);
    }, [minDate]);

    const computedMaxDate = useMemo(() => {
      if (maxDate) return maxDate;
      const date = new Date();
      date.setFullYear(date.getFullYear() + 2);
      return formatDateToISO(date);
    }, [maxDate]);

    // Build aria-describedby based on available descriptions
    const descriptionIds: string[] = [];
    if (ariaDescribedBy) descriptionIds.push(ariaDescribedBy);
    if (error) descriptionIds.push(errorId);
    else if (helperText || formatHint) descriptionIds.push(helperId);

    return (
      <div
        className={cn(
          'flex flex-col gap-1.5',
          fullWidth && 'w-full',
          containerClassName
        )}
      >
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'text-sm font-medium text-surface-700',
              disabled && 'text-surface-400 cursor-not-allowed',
              showError && 'text-red-600'
            )}
          >
            {label}
            {required && (
              <span className="text-red-500 ml-0.5" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        {/* Date input wrapper */}
        <div className="relative">
          <input
            ref={ref}
            type="date"
            id={inputId}
            disabled={disabled}
            required={required}
            min={computedMinDate}
            max={computedMaxDate}
            aria-invalid={showError}
            aria-describedby={
              descriptionIds.length > 0 ? descriptionIds.join(' ') : undefined
            }
            aria-required={required}
            className={cn(
              // Base styles
              'w-full rounded-md border bg-white transition-colors duration-200',
              // Size styles
              sizeClasses[size],
              // Focus styles - pink/magenta accent
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              // Placeholder/empty state
              '[&::-webkit-datetime-edit-text]:text-surface-500',
              '[&::-webkit-datetime-edit-month-field]:text-surface-900',
              '[&::-webkit-datetime-edit-day-field]:text-surface-900',
              '[&::-webkit-datetime-edit-year-field]:text-surface-900',
              // Calendar icon styling
              '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
              '[&::-webkit-calendar-picker-indicator]:p-1',
              '[&::-webkit-calendar-picker-indicator]:hover:opacity-70',
              // Default border
              !showError && 'border-surface-300 hover:border-surface-400',
              // Error state
              showError &&
                'border-red-500 text-red-900 focus:ring-red-500 focus:border-red-500',
              // Disabled state
              disabled &&
                'bg-surface-100 text-surface-500 cursor-not-allowed border-surface-200 [&::-webkit-calendar-picker-indicator]:cursor-not-allowed',
              className
            )}
            {...props}
          />
        </div>

        {/* Error message */}
        {error && (
          <p id={errorId} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {/* Helper text (only shown when no error) */}
        {(helperText || formatHint) && !error && (
          <p id={helperId} className="text-sm text-surface-500">
            {helperText || formatHint}
          </p>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';

/**
 * DateRangePicker Component
 * A compound component for selecting date ranges
 */
export interface DateRangePickerProps {
  /** Start date value (ISO format: YYYY-MM-DD) */
  startDate?: string;
  /** End date value (ISO format: YYYY-MM-DD) */
  endDate?: string;
  /** Callback when start date changes */
  onStartDateChange?: (date: string) => void;
  /** Callback when end date changes */
  onEndDateChange?: (date: string) => void;
  /** Start date label */
  startLabel?: string;
  /** End date label */
  endLabel?: string;
  /** Minimum selectable date */
  minDate?: string;
  /** Maximum selectable date */
  maxDate?: string;
  /** Whether the inputs are disabled */
  disabled?: boolean;
  /** Whether the inputs are required */
  required?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Error message for start date */
  startError?: string;
  /** Error message for end date */
  endError?: string;
  /** Whether to stack vertically on small screens */
  responsive?: boolean;
  /** Container class name */
  className?: string;
}

/**
 * DateRangePicker component for selecting date ranges
 */
export const DateRangePicker: FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startLabel = 'From Date',
  endLabel = 'To Date',
  minDate,
  maxDate,
  disabled = false,
  required = false,
  size = 'md',
  startError,
  endError,
  responsive = true,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex gap-4',
        responsive && 'flex-col sm:flex-row',
        className
      )}
    >
      <DatePicker
        label={startLabel}
        value={startDate}
        onChange={(e) => onStartDateChange?.(e.target.value)}
        minDate={minDate}
        maxDate={endDate || maxDate}
        disabled={disabled}
        required={required}
        size={size}
        error={startError}
        fullWidth
      />
      <DatePicker
        label={endLabel}
        value={endDate}
        onChange={(e) => onEndDateChange?.(e.target.value)}
        minDate={startDate || minDate}
        maxDate={maxDate}
        disabled={disabled}
        required={required}
        size={size}
        error={endError}
        fullWidth
      />
    </div>
  );
};

DateRangePicker.displayName = 'DateRangePicker';

export default DatePicker;
