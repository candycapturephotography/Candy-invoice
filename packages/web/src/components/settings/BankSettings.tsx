/**
 * CandyCapture Photography Invoice Application
 * BankSettings Component
 *
 * Component for managing bank/payment details including
 * account name, bank name, account number, IFSC code, and UPI ID.
 *
 * @requirements 12.4 Bank details (Account Name, Bank Name, Account No, IFSC, UPI)
 */

import { useState, useCallback } from 'react';
import type { Settings } from '../../types/models';
import { Input } from '../ui';
import {
  validateBankAccountNumber,
  validateIFSCCode,
  validateUPIId,
  type ValidationResult,
} from '../../utils/validation';
import { cn } from '../../lib/utils';

export interface BankSettingsProps {
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
  bankAccountName?: string;
  bankName?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  upiId?: string;
}

/**
 * BankSettings Component
 *
 * Provides form fields for managing bank/payment details:
 * - Account Name (max 100 characters)
 * - Bank Name (max 100 characters)
 * - Account Number (9-18 digits)
 * - IFSC Code (4 letters + 0 + 6 alphanumeric)
 * - UPI ID (username@provider format, max 50 characters)
 *
 * @see Requirement 12.4
 */
export function BankSettings({
  settings,
  onChange,
  isLoading = false,
  errors: parentErrors = {},
  className,
}: BankSettingsProps) {
  // Local validation errors
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Merge parent errors with local errors
  const allErrors: FieldErrors = { ...fieldErrors, ...parentErrors };

  /**
   * Validate a single field
   */
  const validateField = useCallback(
    (field: keyof FieldErrors, value: string): string | undefined => {
      switch (field) {
        case 'bankAccountName':
          if (value.length > 100) {
            return 'Account name must not exceed 100 characters';
          }
          return undefined;

        case 'bankName':
          if (value.length > 100) {
            return 'Bank name must not exceed 100 characters';
          }
          return undefined;

        case 'bankAccountNumber': {
          const result: ValidationResult = validateBankAccountNumber(value);
          return result.valid ? undefined : result.error;
        }

        case 'ifscCode': {
          const result: ValidationResult = validateIFSCCode(value);
          return result.valid ? undefined : result.error;
        }

        case 'upiId': {
          const result: ValidationResult = validateUPIId(value);
          return result.valid ? undefined : result.error;
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
      (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;

        // Auto-uppercase IFSC code
        if (field === 'ifscCode') {
          value = value.toUpperCase();
        }

        onChange({ [field]: value });

        // Validate and update error
        const error = validateField(field as keyof FieldErrors, value);
        setFieldErrors((prev) => ({ ...prev, [field]: error }));
      },
    [onChange, validateField]
  );

  /**
   * Handle field blur for validation
   */
  const handleFieldBlur = useCallback(
    (field: keyof Settings) => () => {
      const value = settings[field as keyof Settings];
      const error = validateField(field as keyof FieldErrors, String(value ?? ''));
      setFieldErrors((prev) => ({ ...prev, [field]: error }));
    },
    [settings, validateField]
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Section Header */}
      <div>
        <h3 className="text-lg font-semibold text-surface-900">
          Payment Details
        </h3>
        <p className="mt-1 text-sm text-surface-600">
          Configure bank account and UPI details that appear on invoices
        </p>
      </div>

      {/* Bank Icon */}
      <div className="flex items-center gap-3 rounded-lg border border-surface-200 bg-surface-50 p-4">
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
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-surface-900">
            Bank Transfer Information
          </p>
          <p className="text-xs text-surface-600">
            These details help customers pay via bank transfer
          </p>
        </div>
      </div>

      {/* Account Name */}
      <Input
        label="Account Holder Name"
        placeholder="Enter account holder name"
        value={settings.bankAccountName}
        onChange={handleFieldChange('bankAccountName')}
        onBlur={handleFieldBlur('bankAccountName')}
        error={allErrors.bankAccountName}
        disabled={isLoading}
        fullWidth
        maxLength={100}
        helperText="Name as it appears on the bank account"
      />

      {/* Bank Name */}
      <Input
        label="Bank Name"
        placeholder="Enter bank name"
        value={settings.bankName}
        onChange={handleFieldChange('bankName')}
        onBlur={handleFieldBlur('bankName')}
        error={allErrors.bankName}
        disabled={isLoading}
        fullWidth
        maxLength={100}
        helperText="e.g., ICICI Bank, HDFC Bank, SBI"
      />

      {/* Account Number and IFSC Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Account Number */}
        <Input
          label="Account Number"
          placeholder="Enter account number"
          value={settings.bankAccountNumber}
          onChange={handleFieldChange('bankAccountNumber')}
          onBlur={handleFieldBlur('bankAccountNumber')}
          error={allErrors.bankAccountNumber}
          disabled={isLoading}
          fullWidth
          maxLength={18}
          helperText="9 to 18 digits"
        />

        {/* IFSC Code */}
        <Input
          label="IFSC Code"
          placeholder="e.g., ICIC0001234"
          value={settings.ifscCode}
          onChange={handleFieldChange('ifscCode')}
          onBlur={handleFieldBlur('ifscCode')}
          error={allErrors.ifscCode}
          disabled={isLoading}
          fullWidth
          maxLength={11}
          helperText="4 letters + 0 + 6 alphanumeric"
        />
      </div>

      {/* UPI Section Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-sm text-surface-500">
            Or pay via UPI
          </span>
        </div>
      </div>

      {/* UPI Icon */}
      <div className="flex items-center gap-3 rounded-lg border border-surface-200 bg-surface-50 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-5 w-5 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-surface-900">
            UPI Payment
          </p>
          <p className="text-xs text-surface-600">
            Customers can pay directly using your UPI ID
          </p>
        </div>
      </div>

      {/* UPI ID */}
      <Input
        label="UPI ID"
        placeholder="username@bankname"
        value={settings.upiId}
        onChange={handleFieldChange('upiId')}
        onBlur={handleFieldBlur('upiId')}
        error={allErrors.upiId}
        disabled={isLoading}
        fullWidth
        maxLength={50}
        helperText="Format: username@provider (e.g., candycapture@upi)"
      />

      {/* Note: No QR code per Requirement 12.5 */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div className="flex gap-2">
          <svg
            className="h-5 w-5 flex-shrink-0 text-amber-600"
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
          <p className="text-sm text-amber-700">
            Payment QR codes are not displayed on invoices. Customers can use the 
            bank details or UPI ID provided above to make payments.
          </p>
        </div>
      </div>
    </div>
  );
}

export default BankSettings;
