/**
 * CandyCapture Photography Invoice Application
 * useCustomerDeletion Hook
 *
 * Custom hook for handling customer deletion with invoice protection.
 * Checks for associated invoices before deletion and shows appropriate messages.
 *
 * @requirements 5.7 Prevent deletion of customers with invoices
 * @requirements 5.8 Delete customers with no invoices
 */

import { useState, useCallback } from 'react';
import type { Customer } from '../../types/models';
import { customerService, type DeleteResult } from '../../services/customerService';

export interface CustomerDeletionState {
  /** Whether deletion is in progress */
  isDeleting: boolean;
  /** Whether confirmation modal should be shown */
  showConfirmModal: boolean;
  /** Customer pending deletion */
  customerToDelete: Customer | null;
  /** Error message from failed deletion */
  error: string | null;
  /** Success message after deletion */
  success: string | null;
}

export interface UseCustomerDeletionResult {
  /** Current state */
  state: CustomerDeletionState;
  /** Initiates deletion process (checks for invoices first) */
  requestDelete: (customer: Customer) => Promise<void>;
  /** Confirms and executes deletion */
  confirmDelete: () => Promise<boolean>;
  /** Cancels deletion and closes modal */
  cancelDelete: () => void;
  /** Clears error message */
  clearError: () => void;
  /** Clears success message */
  clearSuccess: () => void;
}

/**
 * Initial state for the deletion hook
 */
const initialState: CustomerDeletionState = {
  isDeleting: false,
  showConfirmModal: false,
  customerToDelete: null,
  error: null,
  success: null,
};

/**
 * useCustomerDeletion Hook
 *
 * Handles customer deletion with:
 * - Invoice protection check before deletion
 * - Error message if customer has invoices
 * - Confirmation dialog if no invoices
 * - Success/error state management
 */
export function useCustomerDeletion(): UseCustomerDeletionResult {
  const [state, setState] = useState<CustomerDeletionState>(initialState);

  /**
   * Request to delete a customer
   * First checks if customer has associated invoices
   *
   * @requirements 5.7 Check for associated invoices before deletion
   */
  const requestDelete = useCallback(async (customer: Customer) => {
    setState((prev) => ({
      ...prev,
      error: null,
      success: null,
      customerToDelete: customer,
    }));

    try {
      // Check invoice count for the customer
      const invoiceCount = await customerService.getCustomerInvoiceCount(customer.id);

      if (invoiceCount > 0) {
        // Customer has invoices - show error message
        setState((prev) => ({
          ...prev,
          showConfirmModal: false,
          error: `Cannot delete customer "${customer.name}" because they have ${invoiceCount} invoice${invoiceCount > 1 ? 's' : ''} associated.`,
          customerToDelete: null,
        }));
        return;
      }

      // No invoices - show confirmation modal
      setState((prev) => ({
        ...prev,
        showConfirmModal: true,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: 'Failed to check customer invoices. Please try again.',
        customerToDelete: null,
      }));
    }
  }, []);

  /**
   * Confirm and execute the deletion
   *
   * @requirements 5.8 Delete customer if no invoices exist
   */
  const confirmDelete = useCallback(async (): Promise<boolean> => {
    if (!state.customerToDelete) {
      return false;
    }

    setState((prev) => ({
      ...prev,
      isDeleting: true,
      error: null,
    }));

    try {
      const result: DeleteResult = await customerService.deleteCustomer(
        state.customerToDelete.id
      );

      if (result.success) {
        setState({
          ...initialState,
          success: `Customer "${state.customerToDelete.name}" has been deleted successfully.`,
        });
        return true;
      } else {
        // Deletion failed (likely has invoices created between check and delete)
        setState((prev) => ({
          ...prev,
          isDeleting: false,
          showConfirmModal: false,
          error: result.error ?? 'Failed to delete customer.',
          customerToDelete: null,
        }));
        return false;
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isDeleting: false,
        showConfirmModal: false,
        error: 'An error occurred while deleting the customer. Please try again.',
        customerToDelete: null,
      }));
      return false;
    }
  }, [state.customerToDelete]);

  /**
   * Cancel the deletion and close modal
   */
  const cancelDelete = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showConfirmModal: false,
      customerToDelete: null,
    }));
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  /**
   * Clear success message
   */
  const clearSuccess = useCallback(() => {
    setState((prev) => ({
      ...prev,
      success: null,
    }));
  }, []);

  return {
    state,
    requestDelete,
    confirmDelete,
    cancelDelete,
    clearError,
    clearSuccess,
  };
}

export default useCustomerDeletion;
