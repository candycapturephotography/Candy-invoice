/**
 * CandyCapture Photography Invoice Application
 * Checkbox Component
 *
 * A checkbox component with label support and accessibility features.
 * Uses pink/magenta (#E91E63) accent for checked and focus states.
 *
 * Requirements: 14.5, 1.3 - Pink/magenta (#E91E63) accent styling
 */

import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Checkbox label text */
  label?: string;
  /** Description text displayed below the label */
  description?: string;
  /** Error message displayed when there's a validation error */
  error?: string;
  /** Whether the checkbox has an error state */
  hasError?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Label position */
  labelPosition?: 'left' | 'right';
  /** Container class name */
  containerClassName?: string;
}

/**
 * Checkbox component with label and description support
 * Uses pink/magenta (#E91E63) accent for checked and focus states
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      description,
      error,
      hasError,
      size = 'md',
      labelPosition = 'right',
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
    const checkboxId = providedId || generatedId;
    const descriptionId = `${checkboxId}-description`;
    const errorId = `${checkboxId}-error`;

    // Determine if we should show error styling
    const showError = hasError || !!error;

    // Size classes for checkbox
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    // Text size classes
    const textSizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    };

    // Build aria-describedby based on available descriptions
    const descriptionIds: string[] = [];
    if (ariaDescribedBy) descriptionIds.push(ariaDescribedBy);
    if (error) descriptionIds.push(errorId);
    else if (description) descriptionIds.push(descriptionId);

    const checkboxElement = (
      <input
        ref={ref}
        type="checkbox"
        id={checkboxId}
        disabled={disabled}
        required={required}
        aria-invalid={showError}
        aria-describedby={
          descriptionIds.length > 0 ? descriptionIds.join(' ') : undefined
        }
        aria-required={required}
        className={cn(
          // Base styles
          'rounded border transition-colors duration-200 cursor-pointer',
          sizeClasses[size],
          // Focus styles - pink/magenta accent
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
          // Checked state - pink/magenta accent
          'checked:bg-primary-500 checked:border-primary-500 checked:hover:bg-primary-600',
          // Indeterminate state
          'indeterminate:bg-primary-500 indeterminate:border-primary-500',
          // Default border
          !showError && 'border-surface-300 hover:border-surface-400',
          // Error state
          showError && 'border-red-500 focus:ring-red-500',
          // Disabled state
          disabled &&
            'bg-surface-100 border-surface-200 cursor-not-allowed checked:bg-surface-300 checked:border-surface-300',
          // Custom accent color for modern browsers
          'accent-primary-500',
          className
        )}
        {...props}
      />
    );

    const labelElement = label && (
      <div className="flex flex-col">
        <label
          htmlFor={checkboxId}
          className={cn(
            'font-medium cursor-pointer select-none',
            textSizeClasses[size],
            disabled
              ? 'text-surface-400 cursor-not-allowed'
              : 'text-surface-700',
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
        {/* Description */}
        {description && !error && (
          <p
            id={descriptionId}
            className={cn(
              'text-surface-500',
              size === 'sm' && 'text-xs',
              size === 'md' && 'text-sm',
              size === 'lg' && 'text-base'
            )}
          >
            {description}
          </p>
        )}
      </div>
    );

    return (
      <div className={cn('flex flex-col gap-1', containerClassName)}>
        <div
          className={cn(
            'flex items-start gap-3',
            labelPosition === 'left' && 'flex-row-reverse justify-end'
          )}
        >
          {checkboxElement}
          {labelElement}
        </div>

        {/* Error message */}
        {error && (
          <p id={errorId} className="text-sm text-red-600 ml-8" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
