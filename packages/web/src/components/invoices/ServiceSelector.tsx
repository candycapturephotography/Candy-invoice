/**
 * ServiceSelector Component
 *
 * @description Component for selecting photography services during invoice creation.
 * Displays enabled services with checkboxes and quantity inputs.
 *
 * @requirements 6.3 Display enabled services in configured order
 * @requirements 8.8 Checkboxes/toggles for service selection
 * @requirements 8.9 Pre-fill default quantity on selection
 * @requirements 8.10 Allow quantity editing (1-999)
 */

import { useState, useEffect, useCallback } from 'react';
import { Checkbox, Input, LoadingSpinner } from '../ui';
import { getServices } from '../../services/serviceService';
import type { Service, InvoiceService } from '../../types';
import { validateServiceQuantity } from '../../utils/validation';
import { cn } from '../../lib/utils';

export interface SelectedService extends InvoiceService {
  /** Whether this service is currently selected */
  selected: boolean;
  /** Validation error for quantity */
  quantityError?: string;
}

export interface ServiceSelectorProps {
  /** Currently selected services */
  selectedServices: InvoiceService[];
  /** Callback when services selection changes */
  onChange: (services: InvoiceService[]) => void;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Error message */
  error?: string;
}

export function ServiceSelector({
  selectedServices,
  onChange,
  disabled = false,
  error,
}: ServiceSelectorProps) {
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [serviceStates, setServiceStates] = useState<Map<string, SelectedService>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load enabled services
  useEffect(() => {
    const loadServices = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const services = await getServices({ enabledOnly: true });
        setAvailableServices(services);

        // Initialize service states
        const initialStates = new Map<string, SelectedService>();
        services.forEach((service) => {
          const existing = selectedServices.find((s) => s.id === service.id);
          initialStates.set(service.id, {
            id: service.id,
            name: service.name,
            quantity: existing?.quantity ?? service.defaultQuantity,
            selected: !!existing,
          });
        });
        setServiceStates(initialStates);
      } catch (err) {
        console.error('Failed to load services:', err);
        setLoadError('Failed to load services. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadServices();
  }, []); // Only load once on mount

  // Sync service states with external selectedServices prop
  useEffect(() => {
    if (availableServices.length === 0) return;

    const newStates = new Map<string, SelectedService>();
    availableServices.forEach((service) => {
      const existing = selectedServices.find((s) => s.id === service.id);
      const currentState = serviceStates.get(service.id);
      newStates.set(service.id, {
        id: service.id,
        name: service.name,
        quantity: existing?.quantity ?? currentState?.quantity ?? service.defaultQuantity,
        selected: !!existing,
      });
    });
    setServiceStates(newStates);
  }, [selectedServices, availableServices]);

  // Notify parent of changes
  const notifyChange = useCallback(
    (states: Map<string, SelectedService>) => {
      const selected = Array.from(states.values())
        .filter((s) => s.selected)
        .map((s) => ({
          id: s.id,
          name: s.name,
          quantity: s.quantity,
        }));
      onChange(selected);
    },
    [onChange]
  );

  // Handle service toggle
  const handleServiceToggle = useCallback(
    (serviceId: string, checked: boolean) => {
      setServiceStates((prev) => {
        const newStates = new Map(prev);
        const service = newStates.get(serviceId);
        if (service) {
          newStates.set(serviceId, { ...service, selected: checked });
          notifyChange(newStates);
        }
        return newStates;
      });
    },
    [notifyChange]
  );

  // Handle quantity change
  const handleQuantityChange = useCallback(
    (serviceId: string, value: string) => {
      const numValue = parseInt(value, 10);

      setServiceStates((prev) => {
        const newStates = new Map(prev);
        const service = newStates.get(serviceId);
        if (service) {
          const validation = validateServiceQuantity(numValue);
          const updatedService = {
            ...service,
            quantity: isNaN(numValue) ? 1 : numValue,
            quantityError: validation.valid ? undefined : validation.error,
          };
          newStates.set(serviceId, updatedService);

          // Only notify if valid
          if (validation.valid) {
            notifyChange(newStates);
          }
        }
        return newStates;
      });
    },
    [notifyChange]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-surface-700">
          Services <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center justify-center p-8 border border-surface-200 rounded-md">
          <LoadingSpinner size="md" />
          <span className="ml-2 text-surface-600">Loading services...</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-surface-700">
          Services <span className="text-red-500">*</span>
        </label>
        <div className="p-4 border border-red-200 rounded-md bg-red-50">
          <p className="text-red-600">{loadError}</p>
        </div>
      </div>
    );
  }

  if (availableServices.length === 0) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-surface-700">
          Services <span className="text-red-500">*</span>
        </label>
        <div className="p-4 border border-surface-200 rounded-md bg-surface-50">
          <p className="text-surface-600">
            No services available. Please add services in Settings.
          </p>
        </div>
      </div>
    );
  }

  const selectedCount = Array.from(serviceStates.values()).filter((s) => s.selected).length;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-surface-700">
          Services <span className="text-red-500">*</span>
        </label>
        <span className="text-sm text-surface-500">
          {selectedCount} selected
        </span>
      </div>

      <div
        className={cn(
          'border rounded-md',
          error ? 'border-red-500' : 'border-surface-200'
        )}
      >
        <div className="max-h-64 overflow-y-auto">
          {availableServices.map((service, index) => {
            const state = serviceStates.get(service.id);
            if (!state) return null;

            return (
              <div
                key={service.id}
                className={cn(
                  'flex items-center gap-3 px-3 py-2',
                  index !== availableServices.length - 1 && 'border-b border-surface-100',
                  state.selected && 'bg-primary-50/50',
                  disabled && 'opacity-60'
                )}
              >
                <Checkbox
                  checked={state.selected}
                  onChange={(e) => handleServiceToggle(service.id, e.target.checked)}
                  disabled={disabled}
                  aria-label={`Select ${service.name}`}
                />

                <span
                  className={cn(
                    'flex-1 text-surface-900',
                    !state.selected && 'text-surface-600'
                  )}
                >
                  {service.name}
                </span>

                {state.selected && (
                  <div className="w-20">
                    <Input
                      type="number"
                      min={1}
                      max={999}
                      value={state.quantity}
                      onChange={(e) => handleQuantityChange(service.id, e.target.value)}
                      disabled={disabled}
                      size="sm"
                      hasError={!!state.quantityError}
                      aria-label={`Quantity for ${service.name}`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default ServiceSelector;
