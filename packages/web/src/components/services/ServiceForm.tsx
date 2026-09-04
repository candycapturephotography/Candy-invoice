/**
 * CandyCapture Photography Invoice Application
 * ServiceForm Component
 *
 * @description Modal form for creating and editing photography services
 * @requirements 6.4 Add custom services, 6.5 Unique service names, 6.6 Edit services
 */

import { useState, useEffect } from 'react';
import type { Service } from '../../types/models';
import {
  saveService,
  getNextDisplayOrder,
  DuplicateServiceNameError,
} from '../../services/serviceService';
import { Modal, Input, useToast } from '../ui';
import { cn } from '../../lib/utils';

/**
 * Props for the ServiceForm component
 */
export interface ServiceFormProps {
  /** Service to edit (null for create mode) */
  service: Service | null;
  /** Callback when service is saved successfully */
  onSave: () => void;
  /** Callback when form is cancelled */
  onCancel: () => void;
}

/**
 * Form validation errors
 */
interface FormErrors {
  name?: string;
  defaultQuantity?: string;
}

/**
 * ServiceForm - Modal form for creating and editing services
 *
 * Features:
 * - Create and edit modes
 * - Validates unique service names (case-insensitive)
 * - Validates quantity range (1-999)
 * - Shows inline validation errors
 *
 * @see Requirement 6.4 Add custom services (max 50)
 * @see Requirement 6.5 Unique service names (case-insensitive)
 * @see Requirement 6.6 Edit service names and quantities
 */
export function ServiceForm({ service, onSave, onCancel }: ServiceFormProps) {
  const isEditMode = !!service;
  const { showToast } = useToast();

  // Form state
  const [name, setName] = useState(service?.name || '');
  const [defaultQuantity, setDefaultQuantity] = useState(
    service?.defaultQuantity?.toString() || '1'
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when service changes
  useEffect(() => {
    if (service) {
      setName(service.name);
      setDefaultQuantity(service.defaultQuantity.toString());
    } else {
      setName('');
      setDefaultQuantity('1');
    }
    setErrors({});
  }, [service]);

  /**
   * Validate form fields
   * @returns true if form is valid
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate name
    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = 'Service name is required';
    } else if (trimmedName.length > 100) {
      newErrors.name = 'Service name must be 100 characters or less';
    }

    // Validate default quantity
    const qty = parseInt(defaultQuantity, 10);
    if (isNaN(qty) || !Number.isInteger(qty)) {
      newErrors.defaultQuantity = 'Quantity must be a whole number';
    } else if (qty < 1) {
      newErrors.defaultQuantity = 'Quantity must be at least 1';
    } else if (qty > 999) {
      newErrors.defaultQuantity = 'Quantity must be 999 or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const now = new Date().toISOString();
      const qty = parseInt(defaultQuantity, 10);

      let serviceToSave: Service;

      if (isEditMode && service) {
        // Update existing service
        serviceToSave = {
          ...service,
          name: name.trim(),
          defaultQuantity: qty,
          updatedAt: now,
        };
      } else {
        // Create new service
        const nextOrder = await getNextDisplayOrder();
        serviceToSave = {
          id: crypto.randomUUID(),
          name: name.trim(),
          defaultQuantity: qty,
          enabled: true,
          displayOrder: nextOrder,
          usageCount: 0,
          createdAt: now,
          updatedAt: now,
        };
      }

      await saveService(serviceToSave);

      showToast(
        isEditMode
          ? `${serviceToSave.name} updated successfully`
          : `${serviceToSave.name} created successfully`,
        'success'
      );

      onSave();
    } catch (err) {
      if (err instanceof DuplicateServiceNameError) {
        // Show duplicate name error inline
        setErrors((prev) => ({
          ...prev,
          name: 'A service with this name already exists',
        }));
      } else {
        console.error('Failed to save service:', err);
        showToast('Failed to save service. Please try again.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle name change with validation clearing
   */
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  /**
   * Handle quantity change with validation
   */
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow empty string or valid numbers
    if (value === '' || /^\d+$/.test(value)) {
      setDefaultQuantity(value);
      if (errors.defaultQuantity) {
        setErrors((prev) => ({ ...prev, defaultQuantity: undefined }));
      }
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={isEditMode ? 'Edit Service' : 'Add Service'}
      size="sm"
      closeOnOverlayClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50 focus:outline-none focus:ring-2 focus:ring-surface-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="service-form"
            disabled={isSubmitting}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed',
              'bg-primary-500 hover:bg-primary-600 focus:ring-primary-500 disabled:bg-primary-300'
            )}
          >
            {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Service'}
          </button>
        </>
      }
    >
      <form id="service-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Service Name */}
        <Input
          label="Service Name"
          placeholder="e.g., Drone Photography"
          value={name}
          onChange={handleNameChange}
          error={errors.name}
          hasError={!!errors.name}
          required
          maxLength={100}
          disabled={isSubmitting}
          autoFocus
          fullWidth
        />

        {/* Default Quantity */}
        <Input
          label="Default Quantity"
          type="text"
          inputMode="numeric"
          placeholder="1"
          value={defaultQuantity}
          onChange={handleQuantityChange}
          error={errors.defaultQuantity}
          hasError={!!errors.defaultQuantity}
          required
          disabled={isSubmitting}
          helperText="Quantity will be pre-filled when selecting this service (1-999)"
          fullWidth
        />

        {/* Information text */}
        <p className="text-xs text-surface-500">
          {isEditMode
            ? 'Changes will apply to new invoices only. Existing invoices are not affected.'
            : 'New services are enabled by default and appear at the end of the list.'}
        </p>
      </form>
    </Modal>
  );
}

export default ServiceForm;
