/**
 * CandyCapture Photography Invoice Application
 * Customer Components Index
 *
 * Exports all customer-related components for the application.
 */

// Customer Form
export { CustomerForm } from './CustomerForm';
export type { CustomerFormProps, CustomerFormData } from './CustomerForm';

// Customer List
export { CustomerList } from './CustomerList';
export type { CustomerListProps } from './CustomerList';

// Customer Search (for invoice creation)
export { CustomerSearch } from './CustomerSearch';
export type { CustomerSearchProps } from './CustomerSearch';

// Customer Deletion Hook
export { useCustomerDeletion } from './useCustomerDeletion';
export type {
  CustomerDeletionState,
  UseCustomerDeletionResult,
} from './useCustomerDeletion';
