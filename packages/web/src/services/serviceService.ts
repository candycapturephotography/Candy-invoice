/**
 * CandyCapture Photography Invoice Application
 * Service Management Storage Service
 *
 * @description Storage service for managing photography services in IndexedDB
 * @requirements 6.3 Display enabled services, 6.5 Unique service names
 */

import { db } from './db';
import type { Service } from '../types/models';

/**
 * Options for retrieving services
 */
export interface GetServicesOptions {
  /**
   * If true, only return enabled services
   * @default false
   */
  enabledOnly?: boolean;
}

/**
 * Error thrown when service name is not unique
 */
export class DuplicateServiceNameError extends Error {
  constructor(name: string) {
    super(`A service with the name "${name}" already exists`);
    this.name = 'DuplicateServiceNameError';
  }
}

/**
 * Error thrown when attempting to delete a service that is in use
 */
export class ServiceInUseError extends Error {
  constructor(name: string, usageCount: number) {
    super(`Cannot delete service "${name}" because it is used in ${usageCount} invoice(s)`);
    this.name = 'ServiceInUseError';
  }
}

/**
 * Error thrown when a service is not found
 */
export class ServiceNotFoundError extends Error {
  constructor(id: string) {
    super(`Service with id "${id}" not found`);
    this.name = 'ServiceNotFoundError';
  }
}

/**
 * Get all services sorted by display order
 *
 * @description Retrieves services from IndexedDB, sorted by displayOrder.
 * Can optionally filter to only return enabled services.
 *
 * @param options - Query options
 * @param options.enabledOnly - If true, only return enabled services
 * @returns Promise resolving to array of services sorted by displayOrder
 *
 * @see Requirement 6.3 Display enabled services in configured order
 *
 * @example
 * ```typescript
 * // Get all services
 * const allServices = await getServices();
 *
 * // Get only enabled services for invoice creation
 * const enabledServices = await getServices({ enabledOnly: true });
 * ```
 */
export async function getServices(options?: GetServicesOptions): Promise<Service[]> {
  const { enabledOnly = false } = options ?? {};

  let services: Service[];

  if (enabledOnly) {
    services = await db.services.where('enabled').equals(1).toArray();
  } else {
    services = await db.services.toArray();
  }

  // Sort by displayOrder
  return services.sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Get a single service by ID
 *
 * @param id - Service ID
 * @returns Promise resolving to the service or undefined if not found
 *
 * @example
 * ```typescript
 * const service = await getServiceById('svc_001');
 * if (service) {
 *   console.log(service.name);
 * }
 * ```
 */
export async function getServiceById(id: string): Promise<Service | undefined> {
  return db.services.get(id);
}

/**
 * Check if a service name already exists (case-insensitive)
 *
 * @param name - Service name to check
 * @param excludeId - Optional service ID to exclude from check (for updates)
 * @returns Promise resolving to true if name exists
 *
 * @see Requirement 6.5 Unique service names (case-insensitive)
 */
async function isServiceNameDuplicate(name: string, excludeId?: string): Promise<boolean> {
  const normalizedName = name.toLowerCase().trim();
  const existingServices = await db.services.toArray();

  return existingServices.some(
    (service) => service.name.toLowerCase().trim() === normalizedName && service.id !== excludeId
  );
}

/**
 * Save a service (create or update)
 *
 * @description Creates a new service or updates an existing one.
 * Enforces unique service names (case-insensitive).
 *
 * @param service - Service to save
 * @throws {DuplicateServiceNameError} If service name already exists
 *
 * @see Requirement 6.5 Unique service names (case-insensitive)
 *
 * @example
 * ```typescript
 * // Create new service
 * const newService: Service = {
 *   id: crypto.randomUUID(),
 *   name: 'Drone Photography',
 *   defaultQuantity: 1,
 *   enabled: true,
 *   displayOrder: 13,
 *   usageCount: 0,
 *   createdAt: new Date().toISOString(),
 *   updatedAt: new Date().toISOString()
 * };
 * await saveService(newService);
 *
 * // Update existing service
 * existingService.name = 'Updated Name';
 * existingService.updatedAt = new Date().toISOString();
 * await saveService(existingService);
 * ```
 */
export async function saveService(service: Service): Promise<void> {
  // Check for duplicate name (case-insensitive), excluding current service if updating
  const isDuplicate = await isServiceNameDuplicate(service.name, service.id);
  if (isDuplicate) {
    throw new DuplicateServiceNameError(service.name);
  }

  // Update the timestamp
  const serviceToSave: Service = {
    ...service,
    updatedAt: new Date().toISOString(),
  };

  await db.services.put(serviceToSave);
}

/**
 * Delete a service
 *
 * @description Deletes a service if it has never been used in any invoice.
 * Services with usageCount > 0 cannot be deleted.
 *
 * @param id - Service ID to delete
 * @throws {ServiceNotFoundError} If service does not exist
 * @throws {ServiceInUseError} If service has been used in invoices
 *
 * @see Requirement 6.8 Support deleting unused services
 * @see Requirement 6.9 Prevent deletion of services used in invoices
 *
 * @example
 * ```typescript
 * try {
 *   await deleteService('svc_001');
 *   console.log('Service deleted');
 * } catch (error) {
 *   if (error instanceof ServiceInUseError) {
 *     console.error('Cannot delete: service is in use');
 *   }
 * }
 * ```
 */
export async function deleteService(id: string): Promise<void> {
  const service = await db.services.get(id);

  if (!service) {
    throw new ServiceNotFoundError(id);
  }

  if (service.usageCount > 0) {
    throw new ServiceInUseError(service.name, service.usageCount);
  }

  await db.services.delete(id);
}

/**
 * Reorder services
 *
 * @description Updates the displayOrder for all services based on the provided
 * ordered array of service IDs.
 *
 * @param orderedIds - Array of service IDs in the desired display order
 *
 * @see Requirement 6.10 Service reordering
 *
 * @example
 * ```typescript
 * // Reorder services after drag-and-drop
 * const newOrder = ['svc_003', 'svc_001', 'svc_002'];
 * await reorderServices(newOrder);
 * ```
 */
export async function reorderServices(orderedIds: string[]): Promise<void> {
  const now = new Date().toISOString();

  await db.transaction('rw', db.services, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      if (id) {
        const service = await db.services.get(id);
        if (service) {
          await db.services.update(id, {
            displayOrder: i + 1,
            updatedAt: now,
          });
        }
      }
    }
  });
}

/**
 * Increment usage count for a service
 *
 * @description Called when a service is added to an invoice.
 * Tracks how many invoices reference this service.
 *
 * @param id - Service ID
 * @throws {ServiceNotFoundError} If service does not exist
 *
 * @see Requirement 6.8-6.9 Usage tracking for deletion protection
 *
 * @example
 * ```typescript
 * // When adding service to invoice
 * await incrementUsageCount('svc_001');
 * ```
 */
export async function incrementUsageCount(id: string): Promise<void> {
  const service = await db.services.get(id);

  if (!service) {
    throw new ServiceNotFoundError(id);
  }

  await db.services.update(id, {
    usageCount: service.usageCount + 1,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Decrement usage count for a service
 *
 * @description Called when a service is removed from an invoice.
 * Decrements the count but never below zero.
 *
 * @param id - Service ID
 * @throws {ServiceNotFoundError} If service does not exist
 *
 * @see Requirement 6.8-6.9 Usage tracking for deletion protection
 *
 * @example
 * ```typescript
 * // When removing service from invoice
 * await decrementUsageCount('svc_001');
 * ```
 */
export async function decrementUsageCount(id: string): Promise<void> {
  const service = await db.services.get(id);

  if (!service) {
    throw new ServiceNotFoundError(id);
  }

  await db.services.update(id, {
    usageCount: Math.max(0, service.usageCount - 1),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Get the next available display order
 *
 * @description Returns the next display order value for a new service.
 *
 * @returns Promise resolving to the next display order number
 *
 * @example
 * ```typescript
 * const nextOrder = await getNextDisplayOrder();
 * const newService = { ...serviceData, displayOrder: nextOrder };
 * ```
 */
export async function getNextDisplayOrder(): Promise<number> {
  const services = await db.services.toArray();
  if (services.length === 0) {
    return 1;
  }
  const maxOrder = Math.max(...services.map((s) => s.displayOrder));
  return maxOrder + 1;
}
