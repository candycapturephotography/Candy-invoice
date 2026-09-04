/**
 * CandyCapture Photography Invoice Application
 * BusinessSettings Component
 *
 * Component for managing business information settings including
 * name, address, phone, email, Instagram handle, and logo upload.
 *
 * @requirements 12.1 Business information fields
 * @requirements 12.2 Logo upload with validation (PNG/JPG, 2MB max, 1024×1024 max)
 * @requirements 12.3 Specific validation errors for logo upload failures
 */

import { useState, useCallback, useRef } from 'react';
import type { Settings } from '../../types/models';
import { Input } from '../ui';
import {
  validateMobileNumber,
  validateRequiredEmail,
  validateInstagramHandle,
  type ValidationResult,
} from '../../utils/validation';
import { cn } from '../../lib/utils';

export interface BusinessSettingsProps {
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
 * Logo validation constraints
 * @see Requirement 12.2
 */
const LOGO_CONSTRAINTS = {
  maxSizeBytes: 2 * 1024 * 1024, // 2MB
  maxWidth: 1024,
  maxHeight: 1024,
  allowedTypes: ['image/png', 'image/jpeg', 'image/jpg'],
  allowedExtensions: ['.png', '.jpg', '.jpeg'],
};

/**
 * Field validation errors state
 */
interface FieldErrors {
  businessName?: string;
  address?: string;
  phone?: string;
  email?: string;
  instagramHandle?: string;
  logo?: string;
}

/**
 * BusinessSettings Component
 *
 * Provides form fields for managing business information:
 * - Business Name (max 100 characters)
 * - Address (max 500 characters)
 * - Phone Number (10-digit Indian mobile)
 * - Email (valid email format, max 254 characters)
 * - Instagram Handle (max 30 characters, alphanumeric and underscores)
 * - Logo Upload (PNG/JPG, 2MB max, 1024×1024 max)
 *
 * @see Requirements 12.1, 12.2, 12.3
 */
export function BusinessSettings({
  settings,
  onChange,
  isLoading = false,
  errors: parentErrors = {},
  className,
}: BusinessSettingsProps) {
  // Local validation errors
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  // Logo preview state
  const [logoPreview, setLogoPreview] = useState<string | undefined>(settings.logoUrl);
  // Logo upload loading state
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Merge parent errors with local errors
  const allErrors: FieldErrors = { ...fieldErrors, ...parentErrors };

  /**
   * Validate a single field
   */
  const validateField = useCallback(
    (field: keyof FieldErrors, value: string): string | undefined => {
      switch (field) {
        case 'businessName':
          if (!value.trim()) {
            return 'Business name is required';
          }
          if (value.length > 100) {
            return 'Business name must not exceed 100 characters';
          }
          return undefined;

        case 'address':
          if (value.length > 500) {
            return 'Address must not exceed 500 characters';
          }
          return undefined;

        case 'phone': {
          const result: ValidationResult = validateMobileNumber(value);
          return result.valid ? undefined : result.error;
        }

        case 'email': {
          const result: ValidationResult = validateRequiredEmail(value);
          return result.valid ? undefined : result.error;
        }

        case 'instagramHandle': {
          const result: ValidationResult = validateInstagramHandle(value);
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

  /**
   * Validate logo file
   * @see Requirements 12.2, 12.3
   */
  const validateLogoFile = useCallback(
    async (file: File): Promise<{ valid: boolean; error?: string }> => {
      // Check file type
      if (!LOGO_CONSTRAINTS.allowedTypes.includes(file.type)) {
        return {
          valid: false,
          error: `Invalid file format. Only PNG and JPG files are allowed.`,
        };
      }

      // Check file size
      if (file.size > LOGO_CONSTRAINTS.maxSizeBytes) {
        const maxSizeMB = LOGO_CONSTRAINTS.maxSizeBytes / (1024 * 1024);
        return {
          valid: false,
          error: `File size exceeds ${maxSizeMB}MB limit. Please choose a smaller file.`,
        };
      }

      // Check image dimensions
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          if (
            img.width > LOGO_CONSTRAINTS.maxWidth ||
            img.height > LOGO_CONSTRAINTS.maxHeight
          ) {
            resolve({
              valid: false,
              error: `Image dimensions exceed ${LOGO_CONSTRAINTS.maxWidth}×${LOGO_CONSTRAINTS.maxHeight} pixels. Please resize the image.`,
            });
          } else {
            resolve({ valid: true });
          }
          URL.revokeObjectURL(img.src);
        };
        img.onerror = () => {
          resolve({
            valid: false,
            error: 'Failed to load image. The file may be corrupted.',
          });
          URL.revokeObjectURL(img.src);
        };
        img.src = URL.createObjectURL(file);
      });
    },
    []
  );

  /**
   * Handle logo file selection
   * @see Requirements 12.2, 12.3
   */
  const handleLogoChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Clear previous error
      setFieldErrors((prev) => ({ ...prev, logo: undefined }));
      setIsUploadingLogo(true);

      try {
        // Validate the file
        const validation = await validateLogoFile(file);
        if (!validation.valid) {
          setFieldErrors((prev) => ({ ...prev, logo: validation.error }));
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }

        // Create preview URL and update settings
        // In a real app, this would upload to S3 and return a URL
        // For now, we'll use a data URL for local preview
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          setLogoPreview(dataUrl);
          onChange({ logoUrl: dataUrl });
        };
        reader.onerror = () => {
          setFieldErrors((prev) => ({
            ...prev,
            logo: 'Failed to read the file. Please try again.',
          }));
        };
        reader.readAsDataURL(file);
      } finally {
        setIsUploadingLogo(false);
      }
    },
    [onChange, validateLogoFile]
  );

  /**
   * Handle logo removal
   */
  const handleRemoveLogo = useCallback(() => {
    setLogoPreview(undefined);
    onChange({ logoUrl: undefined });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFieldErrors((prev) => ({ ...prev, logo: undefined }));
  }, [onChange]);

  /**
   * Trigger file input click
   */
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Section Header */}
      <div>
        <h3 className="text-lg font-semibold text-surface-900">
          Business Information
        </h3>
        <p className="mt-1 text-sm text-surface-600">
          Configure your studio&apos;s details that appear on invoices
        </p>
      </div>

      {/* Logo Upload Section */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-surface-700">
          Business Logo
        </label>

        <div className="flex items-start gap-4">
          {/* Logo Preview */}
          <div
            className={cn(
              'flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed',
              logoPreview
                ? 'border-primary-300 bg-primary-50'
                : 'border-surface-300 bg-surface-50'
            )}
          >
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Business logo preview"
                className="h-20 w-20 rounded object-contain"
              />
            ) : (
              <svg
                className="h-10 w-10 text-surface-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            )}
          </div>

          {/* Upload Controls */}
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={isLoading || isUploadingLogo}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm font-medium text-surface-700',
                  'transition-colors hover:bg-surface-50',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                  'disabled:cursor-not-allowed disabled:opacity-50'
                )}
              >
                {isUploadingLogo ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
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
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    Upload Logo
                  </>
                )}
              </button>

              {logoPreview && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={isLoading}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600',
                    'transition-colors hover:bg-red-50',
                    'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
                    'disabled:cursor-not-allowed disabled:opacity-50'
                  )}
                >
                  Remove
                </button>
              )}
            </div>

            <p className="text-xs text-surface-500">
              PNG or JPG, max 2MB, max 1024×1024 pixels
            </p>

            {/* Logo Error Message */}
            {allErrors.logo && (
              <p className="text-sm text-red-600" role="alert">
                {allErrors.logo}
              </p>
            )}
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,image/png,image/jpeg"
          onChange={handleLogoChange}
          className="hidden"
          aria-label="Upload logo file"
        />
      </div>

      {/* Business Name */}
      <Input
        label="Business Name"
        placeholder="Enter your business name"
        value={settings.businessName}
        onChange={handleFieldChange('businessName')}
        onBlur={handleFieldBlur('businessName')}
        error={allErrors.businessName}
        required
        disabled={isLoading}
        fullWidth
        maxLength={100}
        helperText="Appears on invoices and receipts"
      />

      {/* Address */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-surface-700">
          Address
        </label>
        <textarea
          placeholder="Enter your business address"
          value={settings.address}
          onChange={handleFieldChange('address')}
          onBlur={handleFieldBlur('address')}
          disabled={isLoading}
          rows={3}
          maxLength={500}
          className={cn(
            'w-full rounded-md border bg-white px-3 py-2 text-base transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            'placeholder:text-surface-400',
            allErrors.address
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-surface-300 hover:border-surface-400',
            isLoading && 'bg-surface-100 text-surface-500 cursor-not-allowed border-surface-200'
          )}
        />
        {allErrors.address ? (
          <p className="text-sm text-red-600" role="alert">
            {allErrors.address}
          </p>
        ) : (
          <p className="text-sm text-surface-500">
            {settings.address.length}/500 characters
          </p>
        )}
      </div>

      {/* Phone and Email Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Phone Number */}
        <Input
          label="Phone Number"
          placeholder="Enter 10-digit mobile number"
          value={settings.phone}
          onChange={handleFieldChange('phone')}
          onBlur={handleFieldBlur('phone')}
          error={allErrors.phone}
          required
          disabled={isLoading}
          fullWidth
          type="tel"
          maxLength={10}
          helperText="10-digit Indian mobile number"
        />

        {/* Email */}
        <Input
          label="Email"
          placeholder="Enter business email"
          value={settings.email}
          onChange={handleFieldChange('email')}
          onBlur={handleFieldBlur('email')}
          error={allErrors.email}
          required
          disabled={isLoading}
          fullWidth
          type="email"
          maxLength={254}
        />
      </div>

      {/* Instagram Handle */}
      <Input
        label="Instagram Handle"
        placeholder="Enter Instagram username"
        value={settings.instagramHandle}
        onChange={handleFieldChange('instagramHandle')}
        onBlur={handleFieldBlur('instagramHandle')}
        error={allErrors.instagramHandle}
        disabled={isLoading}
        fullWidth
        maxLength={30}
        helperText="Without the @ symbol (e.g., candycapturephotography)"
        leftIcon={
          <span className="text-surface-500">@</span>
        }
      />
    </div>
  );
}

export default BusinessSettings;
