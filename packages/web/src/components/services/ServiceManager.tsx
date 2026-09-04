/**
 * CandyCapture Photography Invoice Application
 * ServiceManager Component
 *
 * @description Component for managing photography services with drag-and-drop reordering
 * @requirements 6.1 Service list management, 6.2 Pre-populated services, 6.10 Service reordering
 */

import { useState, useEffect, useCallback } from 'react';
import type { Service } from '../../types/models';
import {
  getServices,
  saveService,
  deleteService,
  reorderServices,
  ServiceInUseError,
} from '../../services/serviceService';
import { initializeDatabase } from '../../services/db';
import { Toggle, LoadingSpinner, ConfirmModal, useToast } from '../ui';
import { cn } from '../../lib/utils';
import { ServiceForm } from './ServiceForm';

/**
 * Props for the ServiceManager component
 */
export interface ServiceManagerProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * ServiceManager - Main component for managing photography services
 *
 * Features:
 * - Lists all services with name, default quantity, and enabled status
 * - Supports drag-and-drop reordering
 * - Pre-populates with 12 standard services on first load
 * - Add, edit, delete, and toggle services
 *
 * @see Requirement 6.1 Service list with name, defaultQuantity, enabled
 * @see Requirement 6.2 Pre-populate with 12 standard services
 * @see Requirement 6.10 Service reordering
 */
export function ServiceManager({ className }: ServiceManagerProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteConfirmService, setDeleteConfirmService] = useState<Service | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showToast } = useToast();

  /**
   * Load services from IndexedDB
   */
  const loadServices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize database (pre-populates services if empty - Requirement 6.2)
      await initializeDatabase();

      // Get all services sorted by displayOrder
      const loadedServices = await getServices();
      setServices(loadedServices);
    } catch (err) {
      console.error('Failed to load services:', err);
      setError('Failed to load services. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load services on mount
  useEffect(() => {
    loadServices();
  }, [loadServices]);

  /**
   * Handle toggling service enabled status
   * @see Requirement 6.7 Enable/disable services
   */
  const handleToggleEnabled = async (service: Service) => {
    try {
      const updatedService: Service = {
        ...service,
        enabled: !service.enabled,
        updatedAt: new Date().toISOString(),
      };
      await saveService(updatedService);
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? updatedService : s))
      );
      showToast(
        `${service.name} ${updatedService.enabled ? 'enabled' : 'disabled'}`,
        'success'
      );
    } catch (err) {
      console.error('Failed to toggle service:', err);
      showToast('Failed to update service. Please try again.', 'error');
    }
  };

  /**
   * Handle adding a new service
   * @see Requirement 6.4 Add custom services
   */
  const handleAddService = () => {
    setEditingService(null);
    setIsFormOpen(true);
  };

  /**
   * Handle editing a service
   * @see Requirement 6.6 Edit service names and quantities
   */
  const handleEditService = (service: Service) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  /**
   * Handle form save (create or update)
   */
  const handleFormSave = async () => {
    await loadServices();
    setIsFormOpen(false);
    setEditingService(null);
  };

  /**
   * Handle form cancel
   */
  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingService(null);
  };

  /**
   * Handle delete service button click
   * @see Requirement 6.8, 6.9 Delete unused services, prevent used service deletion
   */
  const handleDeleteClick = (service: Service) => {
    setDeleteConfirmService(service);
  };

  /**
   * Confirm and execute service deletion
   */
  const handleConfirmDelete = async () => {
    if (!deleteConfirmService) return;

    try {
      setIsDeleting(true);
      await deleteService(deleteConfirmService.id);
      setServices((prev) => prev.filter((s) => s.id !== deleteConfirmService.id));
      showToast(`${deleteConfirmService.name} deleted successfully`, 'success');
      setDeleteConfirmService(null);
    } catch (err) {
      if (err instanceof ServiceInUseError) {
        showToast(err.message, 'error');
      } else {
        console.error('Failed to delete service:', err);
        showToast('Failed to delete service. Please try again.', 'error');
      }
      setDeleteConfirmService(null);
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Handle drag start
   * @see Requirement 6.10 Drag-and-drop reordering
   */
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  /**
   * Handle drag over
   */
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  /**
   * Handle drag end - reorder services
   */
  const handleDragEnd = async () => {
    if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder locally first
    const newServices = [...services];
    const [draggedService] = newServices.splice(draggedIndex, 1);
    if (draggedService) {
      newServices.splice(dragOverIndex, 0, draggedService);
    }

    // Update display order for all services
    const reorderedServices = newServices.map((service, index) => ({
      ...service,
      displayOrder: index + 1,
    }));

    setServices(reorderedServices);
    setDraggedIndex(null);
    setDragOverIndex(null);

    // Persist to database
    try {
      const orderedIds = reorderedServices.map((s) => s.id);
      await reorderServices(orderedIds);
      showToast('Services reordered successfully', 'success');
    } catch (err) {
      console.error('Failed to reorder services:', err);
      showToast('Failed to save reordering. Please try again.', 'error');
      // Reload to restore original order
      await loadServices();
    }
  };

  /**
   * Handle drag leave
   */
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('p-4', className)}>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p>{error}</p>
          <button
            onClick={loadServices}
            className="mt-2 text-sm font-medium text-red-800 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-surface-900">Photography Services</h2>
          <p className="text-sm text-surface-500">
            Manage services available for invoices. Drag to reorder.
          </p>
        </div>
        <button
          onClick={handleAddService}
          disabled={services.length >= 50}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          title={services.length >= 50 ? 'Maximum of 50 services reached' : 'Add new service'}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Service
        </button>
      </div>

      {/* Services list */}
      <div className="rounded-lg border border-surface-200 bg-white">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 border-b border-surface-200 bg-surface-50 px-4 py-3 text-sm font-medium text-surface-600">
          <div className="col-span-1">#</div>
          <div className="col-span-5">Service Name</div>
          <div className="col-span-2 text-center">Default Qty</div>
          <div className="col-span-2 text-center">Enabled</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* Service rows */}
        <div className="divide-y divide-surface-100">
          {services.map((service, index) => (
            <div
              key={service.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onDragLeave={handleDragLeave}
              className={cn(
                'grid grid-cols-12 items-center gap-4 px-4 py-3 transition-colors',
                'cursor-grab hover:bg-surface-50 active:cursor-grabbing',
                draggedIndex === index && 'opacity-50 bg-primary-50',
                dragOverIndex === index && draggedIndex !== index && 'bg-primary-100 border-t-2 border-primary-500'
              )}
            >
              {/* Order number / Drag handle */}
              <div className="col-span-1 flex items-center gap-2 text-surface-400">
                <svg
                  className="h-4 w-4 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8h16M4 16h16"
                  />
                </svg>
                <span className="text-sm font-medium text-surface-500">{index + 1}</span>
              </div>

              {/* Service name */}
              <div className="col-span-5">
                <span className={cn('font-medium', !service.enabled && 'text-surface-400')}>
                  {service.name}
                </span>
                {service.usageCount > 0 && (
                  <span className="ml-2 text-xs text-surface-400">
                    (used in {service.usageCount} invoice{service.usageCount !== 1 ? 's' : ''})
                  </span>
                )}
              </div>

              {/* Default quantity */}
              <div className="col-span-2 text-center">
                <span className="text-sm text-surface-600">{service.defaultQuantity}</span>
              </div>

              {/* Enabled toggle */}
              <div className="col-span-2 flex justify-center">
                <Toggle
                  size="sm"
                  checked={service.enabled}
                  onChange={() => handleToggleEnabled(service)}
                  aria-label={`${service.enabled ? 'Disable' : 'Enable'} ${service.name}`}
                />
              </div>

              {/* Actions */}
              <div className="col-span-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleEditService(service)}
                  className="rounded p-1.5 text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700"
                  aria-label={`Edit ${service.name}`}
                  title="Edit service"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteClick(service)}
                  disabled={service.usageCount > 0}
                  className={cn(
                    'rounded p-1.5 transition-colors',
                    service.usageCount > 0
                      ? 'cursor-not-allowed text-surface-300'
                      : 'text-surface-500 hover:bg-red-50 hover:text-red-600'
                  )}
                  aria-label={`Delete ${service.name}`}
                  title={
                    service.usageCount > 0
                      ? `Cannot delete: used in ${service.usageCount} invoice(s)`
                      : 'Delete service'
                  }
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {services.length === 0 && (
          <div className="p-8 text-center text-surface-500">
            <p>No services configured. Click "Add Service" to create one.</p>
          </div>
        )}
      </div>

      {/* Service count info */}
      <div className="text-sm text-surface-500">
        {services.length} of 50 services configured
      </div>

      {/* Service Form Modal */}
      {isFormOpen && (
        <ServiceForm
          service={editingService}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmService}
        onClose={() => setDeleteConfirmService(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Service"
        message={`Are you sure you want to delete "${deleteConfirmService?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default ServiceManager;
