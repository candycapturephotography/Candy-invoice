/**
 * Components Index
 *
 * This file exports all components for the CandyCapture Photography
 * Invoice Application.
 */

// UI Components
export * from './ui';

// Invoice Components
export {
  InvoiceForm,
  InvoiceList,
  InvoiceView,
  PaymentRecorder,
  CustomerSearch as InvoiceCustomerSearch,
  ServiceSelector as InvoiceServiceSelector,
} from './invoices';
export type {
  InvoiceFormProps,
  InvoiceFormData,
  InvoiceListProps,
  InvoiceViewProps,
  PaymentRecorderProps,
  CustomerSearchProps as InvoiceCustomerSearchProps,
  ServiceSelectorProps as InvoiceServiceSelectorProps,
  SelectedService,
} from './invoices';

// Customer Components
export * from './customers';

// Service Components
export * from './services';

// Settings Components
export * from './settings';
