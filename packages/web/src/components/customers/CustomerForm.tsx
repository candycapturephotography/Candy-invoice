/**
 * CandyCapture Photography Invoice Application
 * CustomerForm Component
 *
 * Form component for creating and editing customer records.
 * Implements validation for mobile (10 digits) and email format.
 *
 * @requirements 5.1 Customer field requirements
 * @requirements 5.2 Mobile number must be 10 digits
 * @requirements 5.3 Email must have @ and valid domain with at least one dot
 */

import { useState, useCallback, useEffect } from 'react';
import type { Customer } from '../../types/models';
import { Input, DatePicker } from '../ui';
import {
  validateMobileNumber,
  validateEmail,
  type ValidationResult,
} from '../../utils/validation';
import { cn } from '../../lib/utils';

export interface CustomerFormProps {
  /** Customer data for edit mode (undefined for create mode) */
  customer?: Customer;
  /** Callback when form is submitted with valid data */
  onSubmit: (customerData: CustomerFormData) => void | Promise<void>;
  /** Callback when form is cancelled */
  onCancel?: () => void;
  /** Whether the form is in loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Customer form data (excludes computed and system fields)
 */
export interface CustomerFormData {
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  eventType: string;
  eventDate: string;
  location: string;
  notes?: string;
}

/**
 * Validation errors for each field
 */
interface FormErrors {
  name?: string;
  mobile?: string;
  email?: string;
  eventType?: string;
  eventDate?: string;
  location?: string;
}

/**
 * Initial form state for create mode
 */
const getInitialFormData = (customer?: Customer): CustomerFormData => ({
  name: customer?.name ?? '',
  mobile: customer?.mobile ?? '',
  email: customer?.email ?? '',
  address: customer?.address ?? '',
  eventType: customer?.eventType ?? '',
  eventDate: customer?.eventDate ?? '',
  location: customer?.location ?? '',
  notes: customer?.notes ?? '',
});

/**
 * CustomerForm Component
 *
 * Provides a form for creating and editing customer records with:
 * - All required customer fields from Requirement 5.1
 * - Inline validation errors for mobile (10 digits) and email format
 * - Support for create and edit modes
 */
export function CustomerForm({
  customer,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: CustomerFormProps) {
  const isEditMode = !!customer;

  // Form state
  const [formData, setFormData] = useState<CustomerFormData>(() =>
    getInitialFormData(customer)
  );

  // Validation errors
  const [errors, setErrors] = useState<FormErrors>({});

  // Track which fields have been touched (for showing validation on blur)
  const [touched, setTouched] = useState<Record<keyof CustomerFormData, boolean>>({
    name: false,
    mobile: false,
    email: false,
    address: false,
    eventType: false,
    eventDate: false,
    location: false,
    notes: false,
  });

  // Reset form when customer prop changes (for edit mode)
  useEffect(() => {
    if (customer) {
      setFormData(getInitialFormData(customer));
      setErrors({});
      setTouched({
        name: false,
        mobile: false,
        email: false,
        address: false,
        eventType: false,
        eventDate: false,
        location: false,
        notes: false,
      });
    }
  }, [customer]);

  /**
   * Validate a single field
   */
  const validateField = useCallback(
    (field: keyof CustomerFormData, value: string): string | undefined => {
      switch (field) {
        case 'name':
          if (!value.trim()) {
            return 'Name is required';
          }
          if (value.trim().length > 100) {
            return 'Name must not exceed 100 characters';
          }
          return undefined;

        case 'mobile': {
          const result: ValidationResult = validateMobileNumber(value);
          return result.valid ? undefined : result.error;
        }

        case 'email': {
          const result: ValidationResult = validateEmail(value);
          return result.valid ? undefined : result.error;
        }

        case 'eventType':
          if (!value.trim()) {
            return 'Event type is required';
          }
          if (value.trim().length > 100) {
            return 'Event type must not exceed 100 characters';
          }
          return undefined;

        case 'eventDate':
          if (!value) {
            return 'Event date is required';
          }
          return undefined;

        case 'location':
          if (!value.trim()) {
            return 'Location is required';
          }
          if (value.trim().length > 200) {
            return 'Location must not exceed 200 characters';
          }
          return undefined;

        case 'address':
          if (value && value.length > 500) {
            return 'Address must not exceed 500 characters';
          }
          return undefined;

        case 'notes':
          if (value && value.length > 1000) {
            return 'Notes must not exceed 1000 characters';
          }
          return undefined;

        default:
          return undefined;
      }
    },
    []
  );

  /**
   * Validate all form fields
   */
  const validateForm = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};

    const nameError = validateField('name', formData.name);
    if (nameError) newErrors.name = nameError;

    const mobileError = validateField('mobile', formData.mobile);
    if (mobileError) newErrors.mobile = mobileError;

    const emailError = validateField('email', formData.email ?? '');
    if (emailError) newErrors.email = emailError;

    const eventTypeError = validateField('eventType', formData.eventType);
    if (eventTypeError) newErrors.eventType = eventTypeError;

    const eventDateError = validateField('eventDate', formData.eventDate);
    if (eventDateError) newErrors.eventDate = eventDateError;

    const locationError = validateField('location', formData.location);
    if (locationError) newErrors.location = locationError;

    return newErrors;
  }, [formData, validateField]);

  /**
   * Handle field change
   */
  const handleChange = useCallback(
    (field: keyof CustomerFormData) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = e.target.value;
        setFormData((prev) => ({ ...prev, [field]: value }));

        // Clear error if field was touched and now valid
        if (touched[field]) {
          const error = validateField(field, value);
          setErrors((prev) => ({ ...prev, [field]: error }));
        }
      },
    [touched, validateField]
  );

  /**
   * Handle field blur (mark as touched and validate)
   */
  const handleBlur = useCallback(
    (field: keyof CustomerFormData) => () => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const error = validateField(field, formData[field] ?? '');
      setErrors((prev) => ({ ...prev, [field]: error }));
    },
    [formData, validateField]
  );

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Mark all fields as touched
      setTouched({
        name: true,
        mobile: true,
        email: true,
        address: true,
        eventType: true,
        eventDate: true,
        location: true,
        notes: true,
      });

      // Validate all fields
      const formErrors = validateForm();
      setErrors(formErrors);

      // If there are errors, don't submit
      if (Object.keys(formErrors).length > 0) {
        return;
      }

      // Submit form data
      await onSubmit({
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        eventType: formData.eventType.trim(),
        eventDate: formData.eventDate,
        location: formData.location.trim(),
        notes: formData.notes?.trim() || undefined,
      });
    },
    [formData, validateForm, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Customer Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-surface-900">
          Customer Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name - Required */}
          <Input
            label="Name"
            placeholder="Enter customer name"
            value={formData.name}
            onChange={handleChange('name')}
            onBlur={handleBlur('name')}
            error={touched.name ? errors.name : undefined}
            required
            disabled={isLoading}
            fullWidth
          />

          {/* Mobile - Required, 10 digits */}
          <Input
            label="Mobile"
            placeholder="Enter 10-digit mobile number"
            value={formData.mobile}
            onChange={handleChange('mobile')}
            onBlur={handleBlur('mobile')}
            error={touched.mobile ? errors.mobile : undefined}
            required
            disabled={isLoading}
            fullWidth
            type="tel"
            maxLength={10}
            helperText="Must be exactly 10 digits"
          />
        </div>

        {/* Email - Optional */}
        <Input
          label="Email"
          placeholder="Enter email address (optional)"
          value={formData.email ?? ''}
          onChange={handleChange('email')}
          onBlur={handleBlur('email')}
          error={touched.email ? errors.email : undefined}
          disabled={isLoading}
          fullWidth
          type="email"
        />

        {/* Address - Optional */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-surface-700">
            Address
          </label>
          <textarea
            placeholder="Enter customer address (optional)"
            value={formData.address ?? ''}
            onChange={handleChange('address')}
            onBlur={handleBlur('address')}
            disabled={isLoading}
            rows={2}
            maxLength={500}
            className={cn(
              'w-full rounded-md border bg-white px-3 py-2 text-base transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'placeholder:text-surface-400',
              'border-surface-300 hover:border-surface-400',
              isLoading && 'bg-surface-100 text-surface-500 cursor-not-allowed border-surface-200'
            )}
          />
        </div>
      </div>

      {/* Event Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-surface-900">Event Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Event Type - Required */}
          <Input
            label="Event Type"
            placeholder="e.g., Wedding, Birthday, Corporate"
            value={formData.eventType}
            onChange={handleChange('eventType')}
            onBlur={handleBlur('eventType')}
            error={touched.eventType ? errors.eventType : undefined}
            required
            disabled={isLoading}
            fullWidth
          />

          {/* Event Date - Required */}
          <DatePicker
            label="Event Date"
            value={formData.eventDate}
            onChange={(e) =>
              handleChange('eventDate')({
                target: { value: e.target.value },
              } as React.ChangeEvent<HTMLInputElement>)
            }
            onBlur={handleBlur('eventDate')}
            error={touched.eventDate ? errors.eventDate : undefined}
            required
            disabled={isLoading}
            fullWidth
          />
        </div>

        {/* Location - Required */}
        <Input
          label="Location"
          placeholder="Enter event venue/location"
          value={formData.location}
          onChange={handleChange('location')}
          onBlur={handleBlur('location')}
          error={touched.location ? errors.location : undefined}
          required
          disabled={isLoading}
          fullWidth
        />
      </div>

      {/* Notes Section - Optional */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-surface-900">
          Additional Notes
        </h3>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-surface-700">Notes</label>
          <textarea
            placeholder="Enter any additional notes about this customer (optional)"
            value={formData.notes ?? ''}
            onChange={handleChange('notes')}
            onBlur={handleBlur('notes')}
            disabled={isLoading}
            rows={3}
            maxLength={1000}
            className={cn(
              'w-full rounded-md border bg-white px-3 py-2 text-base transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'placeholder:text-surface-400',
              'border-surface-300 hover:border-surface-400',
              isLoading && 'bg-surface-100 text-surface-500 cursor-not-allowed border-surface-200'
            )}
          />
          <p className="text-sm text-surface-500">
            {formData.notes?.length ?? 0}/1000 characters
          </p>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg border border-surface-300 bg-white',
              'text-surface-700 transition-colors hover:bg-surface-50',
              'focus:outline-none focus:ring-2 focus:ring-surface-500 focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg',
            'bg-primary-500 text-white transition-colors hover:bg-primary-600',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:bg-primary-300'
          )}
        >
          {isLoading ? 'Saving...' : isEditMode ? 'Update Customer' : 'Add Customer'}
        </button>
      </div>
    </form>
  );
}

export default CustomerForm;
