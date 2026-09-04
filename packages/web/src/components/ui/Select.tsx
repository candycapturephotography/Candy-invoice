/**
 * CandyCapture Photography Invoice Application
 * Select Component
 *
 * A dropdown select component with validation states and accessibility support.
 * Uses pink/magenta (#E91E63) accent for focus states.
 *
 * Requirements: 14.5, 1.3 - Pink/magenta (#E91E63) accent styling
 */

import { forwardRef, useId } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  /** Option value */
  value: string;
  /** Display label */
  label: string;
  /** Whether the option is disabled */
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Select label text */
  label?: string;
  /** Helper text displayed below the select */
  helperText?: string;
  /** Error message displayed when there's a validation error */
  error?: string;
  /** Whether the select has an error state */
  hasError?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Options to display */
  options: SelectOption[];
  /** Placeholder option text */
  placeholder?: string;
  /** Full width mode */
  fullWidth?: boolean;
  /** Container class name */
  containerClassName?: string;
}

/**
 * Select component with label, error state, and helper text support
 * Uses pink/magenta (#E91E63) accent for focus states
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      hasError,
      size = 'md',
      options,
      placeholder,
      fullWidth = false,
      containerClassName,
      className,
      disabled,
      required,
      id: providedId,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    // Generate unique IDs for accessibility
    const generatedId = useId();
    const selectId = providedId || generatedId;
    const helperId = `${selectId}-helper`;
    const errorId = `${selectId}-error`;

    // Determine if we should show error styling
    const showError = hasError || !!error;

    // Size classes
    const sizeClasses = {
      sm: 'h-8 text-sm px-2 pr-8',
      md: 'h-10 text-base px-3 pr-10',
      lg: 'h-12 text-lg px-4 pr-12',
    };

    // Build aria-describedby based on available descriptions
    const descriptionIds: string[] = [];
    if (ariaDescribedBy) descriptionIds.push(ariaDescribedBy);
    if (error) descriptionIds.push(errorId);
    else if (helperText) descriptionIds.push(helperId);

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
            htmlFor={selectId}
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

        {/* Select wrapper */}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            required={required}
            aria-invalid={showError}
            aria-describedby={
              descriptionIds.length > 0 ? descriptionIds.join(' ') : undefined
            }
            aria-required={required}
            className={cn(
              // Base styles
              'w-full rounded-md border bg-white transition-colors duration-200 appearance-none cursor-pointer',
              // Size styles
              sizeClasses[size],
              // Focus styles - pink/magenta accent
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              // Default border
              !showError && 'border-surface-300 hover:border-surface-400',
              // Error state
              showError &&
                'border-red-500 text-red-900 focus:ring-red-500 focus:border-red-500',
              // Disabled state
              disabled &&
                'bg-surface-100 text-surface-500 cursor-not-allowed border-surface-200',
              className
            )}
            {...props}
          >
            {/* Placeholder option */}
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {/* Options */}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Dropdown arrow icon */}
          <div
            className={cn(
              'absolute inset-y-0 right-0 flex items-center justify-center pointer-events-none',
              size === 'sm' && 'w-8',
              size === 'md' && 'w-10',
              size === 'lg' && 'w-12',
              disabled ? 'text-surface-400' : 'text-surface-500'
            )}
            aria-hidden="true"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p id={errorId} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {/* Helper text (only shown when no error) */}
        {helperText && !error && (
          <p id={helperId} className="text-sm text-surface-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
