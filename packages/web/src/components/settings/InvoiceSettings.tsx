/**
 * CandyCapture Photography Invoice Application
 * InvoiceSettings Component
 *
 * Component for managing invoice-related settings including
 * invoice prefix, default notes/terms, and default due date offset.
 *
 * @requirements 12.6 Invoice prefix (1-10 alphanumeric/hyphens)
 * @requirements 12.7 Default notes/terms (max 2000 chars)
 * @requirements 12.8 Default due date offset (0-365 days)
 */

import { useState, useCallback } from 'react';
import type { Settings } from '../../types/models';
import { Input } from '../ui';
import { validateInvoicePrefix, type ValidationResult } from '../../utils/validation';
import { cn } from '../../lib/utils';

export interface InvoiceSettingsProps {
  /** Current settings data */
  settings: Settings;
  /** Callback when settings change */
  onChange: (updates: Partial<Settings>) => void;
  /** Whether the form is in loading/saving state */
  isLoading?: boolean;
  /** Validation errors from parent */
  errors?: Record<string, string>;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Field validation errors state
 */
interface FieldErrors {
  invoicePrefix?: string;
  defaultNotes?: string;
  defaultDueDays?: string;
}

/**
 * InvoiceSettings Component
 *
 * Provides form fields for managing invoice configuration:
 * - Invoice Prefix (1-10 alphanumeric characters or hyphens, default: "CC-")
 * - Default Notes/Terms (max 2000 characters)
 * - Default Due Date Offset (0-365 days, default: 15)
 *
 * @see Requirements 12.6, 12.7, 12.8
 */
export function InvoiceSettings({
  settings,
  onChange,
  isLoading = false,
  errors: parentErrors = {},
  className,
}: InvoiceSettingsProps) {
  // Local validation errors
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Merge parent errors with local errors
  const allErrors: FieldErrors = { ...fieldErrors, ...parentErrors };

  /**
   * Validate a single field
   */
  const validateField = useCallback(
    (field: keyof FieldErrors, value: string | number): string | undefined => {
      switch (field) {
        case 'invoicePrefix': {
          const result: ValidationResult = validateInvoicePrefix(String(value));
          return result.valid ? undefined : result.error;
        }

        case 'defaultNotes':
          if (String(value).length > 2000) {
            return 'Default notes must not exceed 2000 characters';
          }
          return undefined;

        case 'defaultDueDays': {
          const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
          if (isNaN(numValue)) {
            return 'Due date offset must be a valid number';
          }
          if (numValue < 0) {
            return 'Due date offset cannot be negative';
          }
          if (numValue > 365) {
            return 'Due date offset cannot exceed 365 days';
          }
          if (!Number.isInteger(numValue)) {
            return 'Due date offset must be a whole number';
          }
          return undefined;
        }

        default:
          return undefined;
      }
    },
    []
  );

  /**
   * Handle text field change
   */
  const handleFieldChange = useCallback(
    (field: keyof Settings) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = e.target.value;
        onChange({ [field]: value });

        // Validate and update error
        const error = validateField(field as keyof FieldErrors, value);
        setFieldErrors((prev) => ({ ...prev, [field]: error }));
      },
    [onChange, validateField]
  );

  /**
   * Handle number field change
   */
  const handleNumberChange = useCallback(
    (field: keyof Settings) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numValue = value === '' ? 0 : parseInt(value, 10);

        // Only update if it's a valid number or empty
        if (value === '' || !isNaN(numValue)) {
          onChange({ [field]: numValue });

          // Validate and update error
          const error = validateField(field as keyof FieldErrors, numValue);
          setFieldErrors((prev) => ({ ...prev, [field]: error }));
        }
      },
    [onChange, validateField]
  );

  /**
   * Handle field blur for validation
   */
  const handleFieldBlur = useCallback(
    (field: keyof Settings) => () => {
      const value = settings[field as keyof Settings];
      const error = validateField(
        field as keyof FieldErrors,
        typeof value === 'number' ? value : String(value ?? '')
      );
      setFieldErrors((prev) => ({ ...prev, [field]: error }));
    },
    [settings, validateField]
  );

  // Preview invoice number
  const previewInvoiceNumber = `${settings.invoicePrefix || 'CC-'}1001`;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Section Header */}
      <div>
        <h3 className="text-lg font-semibold text-surface-900">
          Invoice Settings
        </h3>
        <p className="mt-1 text-sm text-surface-600">
          Configure default values for new invoices
        </p>
      </div>

      {/* Invoice Number Preview */}
      <div className="rounded-lg border border-primary-200 bg-primary-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
            <svg
              className="h-5 w-5 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-surface-700">
              Invoice Number Preview
            </p>
            <p className="text-lg font-bold text-primary-600">
              {previewInvoiceNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Invoice Prefix */}
      <div className="space-y-1.5">
        <Input
          label="Invoice Number Prefix"
          placeholder="e.g., CC-, INV-, CANDY-"
          value={settings.invoicePrefix}
          onChange={handleFieldChange('invoicePrefix')}
          onBlur={handleFieldBlur('invoicePrefix')}
          error={allErrors.invoicePrefix}
          required
          disabled={isLoading}
          fullWidth
          maxLength={10}
          helperText="1-10 characters, letters, numbers, and hyphens only"
        />
        <p className="text-xs text-surface-500">
          Invoice numbers will be generated as{' '}
          <span className="font-mono text-primary-600">
            {settings.invoicePrefix || 'CC-'}NNNN
          </span>{' '}
          (e.g., {previewInvoiceNumber})
        </p>
      </div>

      {/* Default Due Date Offset */}
      <div className="space-y-1.5">
        <Input
          label="Default Due Date (Days)"
          placeholder="15"
          value={settings.defaultDueDays.toString()}
          onChange={handleNumberChange('defaultDueDays')}
          onBlur={handleFieldBlur('defaultDueDays')}
          error={allErrors.defaultDueDays}
          disabled={isLoading}
          fullWidth
          type="number"
          min={0}
          max={365}
          helperText="Number of days from invoice date (0-365)"
        />
        <div className="flex items-center gap-2 text-xs text-surface-500">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>
            New invoices will have a due date {settings.defaultDueDays} days after the invoice date
          </span>
        </div>
      </div>

      {/* Section Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-sm text-surface-500">
            Default Invoice Notes
          </span>
        </div>
      </div>

      {/* Default Notes/Terms */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-surface-700">
            Default Notes & Terms
          </label>
          <span className="text-xs text-surface-500">
            {settings.defaultNotes.length}/2000
          </span>
        </div>
        <textarea
          placeholder="Enter default notes and terms that will appear on invoices..."
          value={settings.defaultNotes}
          onChange={handleFieldChange('defaultNotes')}
          onBlur={handleFieldBlur('defaultNotes')}
          disabled={isLoading}
          rows={6}
          maxLength={2000}
          className={cn(
            'w-full rounded-md border bg-white px-3 py-2 text-base transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            'placeholder:text-surface-400',
            allErrors.defaultNotes
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-surface-300 hover:border-surface-400',
            isLoading && 'bg-surface-100 text-surface-500 cursor-not-allowed border-surface-200'
          )}
        />
        {allErrors.defaultNotes && (
          <p className="text-sm text-red-600" role="alert">
            {allErrors.defaultNotes}
          </p>
        )}
        <p className="text-xs text-surface-500">
          These notes will be automatically added to new invoices. You can edit them per invoice.
        </p>
      </div>

      {/* Preview Card */}
      <div className="rounded-lg border border-surface-200 bg-surface-50 p-4">
        <div className="mb-2 flex items-center gap-2">
          <svg
            className="h-4 w-4 text-surface-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          <span className="text-sm font-medium text-surface-700">
            Notes Preview
          </span>
        </div>
        <div className="rounded-md border border-surface-200 bg-white p-3">
          {settings.defaultNotes ? (
            <pre className="whitespace-pre-wrap font-sans text-sm text-surface-600">
              {settings.defaultNotes}
            </pre>
          ) : (
            <p className="text-sm italic text-surface-400">
              No default notes configured. Add notes above to see a preview.
            </p>
          )}
        </div>
      </div>

      {/* Info Note */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
        <div className="flex gap-2">
          <svg
            className="h-5 w-5 flex-shrink-0 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-blue-700">
            Changes to these settings will only apply to new invoices created after saving.
            Existing invoices will not be affected.
          </p>
        </div>
      </div>
    </div>
  );
}

export default InvoiceSettings;
