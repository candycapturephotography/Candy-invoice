/**
 * CandyCapture Photography Invoice Application
 * Input Component
 *
 * A text input component with validation states, labels, and helper text.
 * Supports Indian currency formatting and integrates with form libraries via forwardRef.
 *
 * Requirements: 14.5, 1.3 - Pink/magenta (#E91E63) accent styling
 */

import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input label text */
  label?: string;
  /** Helper text displayed below the input */
  helperText?: string;
  /** Error message displayed when there's a validation error */
  error?: string;
  /** Whether the input has an error state */
  hasError?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Left icon or element */
  leftIcon?: ReactNode;
  /** Right icon or element */
  rightIcon?: ReactNode;
  /** Whether to format as Indian currency */
  formatCurrency?: boolean;
  /** Full width mode */
  fullWidth?: boolean;
  /** Container class name */
  containerClassName?: string;
}

/**
 * Input component with label, error state, and helper text support
 * Uses pink/magenta (#E91E63) accent for focus states
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      hasError,
      size = 'md',
      leftIcon,
      rightIcon,
      formatCurrency,
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

    // Icon padding adjustments
    const leftPadding = {
      sm: leftIcon ? 'pl-8' : '',
      md: leftIcon ? 'pl-10' : '',
      lg: leftIcon ? 'pl-12' : '',
    };

    const rightPadding = {
      sm: rightIcon ? 'pr-8' : '',
      md: rightIcon ? 'pr-10' : '',
      lg: rightIcon ? 'pr-12' : '',
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

        {/* Input wrapper */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div
              className={cn(
                'absolute inset-y-0 left-0 flex items-center justify-center pointer-events-none',
                size === 'sm' && 'w-8',
                size === 'md' && 'w-10',
                size === 'lg' && 'w-12',
                disabled ? 'text-surface-400' : 'text-surface-500'
              )}
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}

          {/* Input element */}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
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
              leftPadding[size],
              rightPadding[size],
              // Focus styles - pink/magenta accent
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              // Placeholder
              'placeholder:text-surface-400',
              // Default border
              !showError && 'border-surface-300 hover:border-surface-400',
              // Error state
              showError &&
                'border-red-500 text-red-900 focus:ring-red-500 focus:border-red-500',
              // Disabled state
              disabled &&
                'bg-surface-100 text-surface-500 cursor-not-allowed border-surface-200',
              // Currency formatting hint
              formatCurrency && 'font-mono',
              className
            )}
            {...props}
          />

          {/* Right icon */}
          {rightIcon && (
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
              {rightIcon}
            </div>
          )}
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

Input.displayName = 'Input';

export default Input;
