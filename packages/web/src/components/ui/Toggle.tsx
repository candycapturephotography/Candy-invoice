/**
 * CandyCapture Photography Invoice Application
 * Toggle Component
 *
 * A toggle switch component with label support and accessibility features.
 * Uses pink/magenta (#E91E63) accent for on state and focus.
 *
 * Requirements: 14.5, 1.3 - Pink/magenta (#E91E63) accent styling
 */

import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface ToggleProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Toggle label text */
  label?: string;
  /** Description text displayed below the label */
  description?: string;
  /** Error message displayed when there's a validation error */
  error?: string;
  /** Whether the toggle has an error state */
  hasError?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Label position */
  labelPosition?: 'left' | 'right';
  /** Container class name */
  containerClassName?: string;
}

/**
 * Toggle switch component with label and description support
 * Uses pink/magenta (#E91E63) accent for on state and focus
 */
export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
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
      checked,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    // Generate unique IDs for accessibility
    const generatedId = useId();
    const toggleId = providedId || generatedId;
    const descriptionId = `${toggleId}-description`;
    const errorId = `${toggleId}-error`;

    // Determine if we should show error styling
    const showError = hasError || !!error;

    // Size dimensions for the toggle track and thumb
    const sizeConfig = {
      sm: {
        track: 'w-8 h-4',
        thumb: 'w-3 h-3',
        thumbTranslate: 'translate-x-4',
        padding: 'p-0.5',
      },
      md: {
        track: 'w-11 h-6',
        thumb: 'w-5 h-5',
        thumbTranslate: 'translate-x-5',
        padding: 'p-0.5',
      },
      lg: {
        track: 'w-14 h-7',
        thumb: 'w-6 h-6',
        thumbTranslate: 'translate-x-7',
        padding: 'p-0.5',
      },
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

    const config = sizeConfig[size];

    const toggleElement = (
      <label
        htmlFor={toggleId}
        className={cn(
          // Track base styles
          'relative inline-flex items-center shrink-0 rounded-full cursor-pointer transition-colors duration-200',
          config.track,
          config.padding,
          // Focus styles - handled via peer
          'peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-primary-500',
          // Off state
          !checked && 'bg-surface-300',
          // On state - pink/magenta accent
          checked && 'bg-primary-500',
          // Error state
          showError && !checked && 'bg-red-200',
          showError && checked && 'bg-red-500',
          // Disabled state
          disabled && 'opacity-50 cursor-not-allowed',
          disabled && !checked && 'bg-surface-200',
          disabled && checked && 'bg-primary-300'
        )}
      >
        {/* Hidden checkbox for accessibility */}
        <input
          ref={ref}
          type="checkbox"
          id={toggleId}
          className="peer sr-only"
          disabled={disabled}
          required={required}
          checked={checked}
          aria-invalid={showError}
          aria-describedby={
            descriptionIds.length > 0 ? descriptionIds.join(' ') : undefined
          }
          aria-required={required}
          role="switch"
          aria-checked={checked}
          {...props}
        />

        {/* Thumb */}
        <span
          className={cn(
            // Base thumb styles
            'inline-block rounded-full bg-white shadow-md transform transition-transform duration-200',
            config.thumb,
            // Position based on checked state
            checked ? config.thumbTranslate : 'translate-x-0'
          )}
          aria-hidden="true"
        />
      </label>
    );

    const labelElement = label && (
      <div className="flex flex-col">
        <span
          className={cn(
            'font-medium select-none',
            textSizeClasses[size],
            disabled
              ? 'text-surface-400 cursor-not-allowed'
              : 'text-surface-700 cursor-pointer',
            showError && 'text-red-600'
          )}
          onClick={() => {
            if (!disabled) {
              const input = document.getElementById(
                toggleId
              ) as HTMLInputElement;
              input?.click();
            }
          }}
        >
          {label}
          {required && (
            <span className="text-red-500 ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </span>
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
            'flex items-center gap-3',
            labelPosition === 'left' && 'flex-row-reverse justify-end'
          )}
        >
          {toggleElement}
          {labelElement}
        </div>

        {/* Error message */}
        {error && (
          <p id={errorId} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';

export default Toggle;
