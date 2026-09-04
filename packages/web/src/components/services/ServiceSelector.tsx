/**
 * CandyCapture Photography Invoice Application
 * ServiceSelector Component
 *
 * @description Component for selecting services when creating invoices
 * @requirements 6.3 Display enabled services, 8.8 Service selection, 8.9 Pre-fill quantity, 8.10 Quantity editing
 */

import { useState, useEffect, useCallback } from 'react';
import type { Service, InvoiceService } from '../../types/models';
import { getServices } from '../../services/serviceService';
import { Checkbox, LoadingSpinner } from '../ui';
import { cn } from '../../lib/utils';

/**
 * Props for the ServiceSelector component
 */
export interface ServiceSelectorProps {
  /** Currently selected services with quantities */
  selectedServices: InvoiceService[];
  /** Callback when service selection changes */
  onChange: (services: InvoiceService[]) => void;
  /** Additional CSS classes */
  className?: string;
  /** Disable the selector */
  disabled?: boolean;
  /** Error message to display */
  error?: string;
}

/**
 * ServiceSelector - Component for selecting services during invoice creation
 *
 * Features:
 * - Displays only enabled services in configured display order
 * - Shows checkboxes for selection
 * - Pre-fills default quantity on selection
 * - Allows quantity editing (1-999)
 *
 * @see Requirement 6.3 Display enabled services in configured order
 * @see Requirement 8.8 Checkboxes/toggles for selection
 * @see Requirement 8.9 Pre-fill default quantity on selection
 * @see Requirement 8.10 Allow quantity editing (1-999)
 */
export function ServiceSelector({
  selectedServices,
  onChange,
  className,
  disabled = false,
  error,
}: ServiceSelectorProps) {
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Track quantity input values separately for smooth editing
  const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>({});

  /**
   * Load enabled services from storage
   */
  const loadServices = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      // Get only enabled services, already sorted by displayOrder
      const services = await getServices({ enabledOnly: true });
      setAvailableServices(services);
    } catch (err) {
      console.error('Failed to load services:', err);
      setLoadError('Failed to load services');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load services on mount
  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Initialize quantity inputs when selected services change externally
  useEffect(() => {
    const inputs: Record<string, string> = {};
    selectedServices.forEach((service) => {
      inputs[service.id] = service.quantity.toString();
    });
    setQuantityInputs(inputs);
  }, [selectedServices]);

  /**
   * Check if a service is selected
   */
  const isServiceSelected = (serviceId: string): boolean => {
    return selectedServices.some((s) => s.id === serviceId);
  };

  /**
   * Get the quantity for a selected service
   */
  const getServiceQuantity = (serviceId: string): number => {
    const selected = selectedServices.find((s) => s.id === serviceId);
    return selected?.quantity || 1;
  };

  /**
   * Handle service selection toggle
   * @see Requirement 8.9 Pre-fill default quantity on selection
   */
  const handleServiceToggle = (service: Service) => {
    if (disabled) return;

    const isSelected = isServiceSelected(service.id);

    if (isSelected) {
      // Remove service
      const newServices = selectedServices.filter((s) => s.id !== service.id);
      // Clean up quantity input
      setQuantityInputs((prev) => {
        const updated = { ...prev };
        delete updated[service.id];
        return updated;
      });
      onChange(newServices);
    } else {
      // Add service with default quantity
      const newService: InvoiceService = {
        id: service.id,
        name: service.name,
        quantity: service.defaultQuantity,
      };
      // Initialize quantity input
      setQuantityInputs((prev) => ({
        ...prev,
        [service.id]: service.defaultQuantity.toString(),
      }));
      onChange([...selectedServices, newService]);
    }
  };

  /**
   * Handle quantity input change
   * Allows free text input for better UX
   */
  const handleQuantityInputChange = (serviceId: string, value: string) => {
    if (disabled) return;

    // Update local input state for smooth editing
    setQuantityInputs((prev) => ({
      ...prev,
      [serviceId]: value,
    }));
  };

  /**
   * Handle quantity blur - validate and update
   * @see Requirement 8.10 Allow quantity editing (1-999)
   */
  const handleQuantityBlur = (serviceId: string) => {
    if (disabled) return;

    const inputValue = quantityInputs[serviceId] || '';
    let qty = parseInt(inputValue, 10);

    // Validate and clamp quantity
    if (isNaN(qty) || qty < 1) {
      qty = 1;
    } else if (qty > 999) {
      qty = 999;
    }

    // Update the input to show the validated value
    setQuantityInputs((prev) => ({
      ...prev,
      [serviceId]: qty.toString(),
    }));

    // Update selected services
    const newServices = selectedServices.map((s) =>
      s.id === serviceId ? { ...s, quantity: qty } : s
    );
    onChange(newServices);
  };

  /**
   * Handle quantity key press - submit on Enter
   */
  const handleQuantityKeyPress = (e: React.KeyboardEvent, serviceId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleQuantityBlur(serviceId);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-4', className)}>
        <LoadingSpinner size="sm" />
        <span className="ml-2 text-sm text-surface-500">Loading services...</span>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className={cn('p-4', className)}>
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {loadError}
          <button
            onClick={loadServices}
            className="ml-2 font-medium underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No services available
  if (availableServices.length === 0) {
    return (
      <div className={cn('p-4 text-center text-surface-500', className)}>
        <p>No services available. Please configure services in Settings.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Section header */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-surface-700">
          Services Booked
          <span className="text-red-500 ml-0.5">*</span>
        </label>
        <span className="text-xs text-surface-500">
          {selectedServices.length} selected
        </span>
      </div>

      {/* Services list */}
      <div
        className={cn(
          'rounded-lg border bg-white',
          error ? 'border-red-500' : 'border-surface-200',
          disabled && 'opacity-50'
        )}
      >
        {/* Column headers */}
        <div className="grid grid-cols-12 gap-2 border-b border-surface-200 bg-surface-50 px-3 py-2 text-xs font-medium text-surface-500">
          <div className="col-span-1"></div>
          <div className="col-span-8">Service</div>
          <div className="col-span-3 text-center">Qty</div>
        </div>

        {/* Service rows */}
        <div className="max-h-[300px] overflow-y-auto divide-y divide-surface-100">
          {availableServices.map((service) => {
            const isSelected = isServiceSelected(service.id);
            const inputValue = quantityInputs[service.id] ?? getServiceQuantity(service.id).toString();

            return (
              <div
                key={service.id}
                className={cn(
                  'grid grid-cols-12 items-center gap-2 px-3 py-2.5 transition-colors',
                  isSelected && 'bg-primary-50',
                  !disabled && 'hover:bg-surface-50'
                )}
              >
                {/* Checkbox */}
                <div className="col-span-1">
                  <Checkbox
                    checked={isSelected}
                    onChange={() => handleServiceToggle(service)}
                    disabled={disabled}
                    aria-label={`Select ${service.name}`}
                  />
                </div>

                {/* Service name - clickable to toggle */}
                <div
                  className={cn(
                    'col-span-8',
                    !disabled && 'cursor-pointer'
                  )}
                  onClick={() => handleServiceToggle(service)}
                >
                  <span
                    className={cn(
                      'text-sm',
                      isSelected ? 'font-medium text-surface-900' : 'text-surface-700'
                    )}
                  >
                    {service.name}
                  </span>
                </div>

                {/* Quantity input */}
                <div className="col-span-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={isSelected ? inputValue : ''}
                    onChange={(e) => handleQuantityInputChange(service.id, e.target.value)}
                    onBlur={() => handleQuantityBlur(service.id)}
                    onKeyDown={(e) => handleQuantityKeyPress(e, service.id)}
                    disabled={disabled || !isSelected}
                    placeholder={isSelected ? '1' : '-'}
                    className={cn(
                      'w-full rounded border px-2 py-1 text-center text-sm transition-colors',
                      'focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500',
                      isSelected
                        ? 'border-surface-300 bg-white'
                        : 'border-transparent bg-transparent text-surface-300 cursor-not-allowed',
                      disabled && 'cursor-not-allowed opacity-50'
                    )}
                    aria-label={`Quantity for ${service.name}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Helper text */}
      <p className="text-xs text-surface-500">
        Select services and specify quantities for this invoice
      </p>
    </div>
  );
}

export default ServiceSelector;
