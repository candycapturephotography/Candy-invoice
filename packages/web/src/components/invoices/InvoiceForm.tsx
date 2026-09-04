/**
 * InvoiceForm Component
 *
 * @description Main form component for creating and editing invoices.
 * Includes customer search, service selection, payment details, and auto-save draft.
 *
 * @requirements 8.1 Invoice creation form with sections
 * @requirements 8.2 Request invoice number from server
 * @requirements 8.3 Default Invoice Date to current date
 * @requirements 8.4 Default Due Date to 15 days from Invoice Date
 * @requirements 8.5 Allow manual date adjustment
 * @requirements 8.11 Require at least one service
 * @requirements 8.12 Require Total Amount > 0
 * @requirements 7.8 Validate Advance Paid ≤ Total Amount
 * @requirements 17.3 Auto-save draft every 30 seconds
 * @requirements 17.4 Offer restore/discard for drafts < 24 hours old
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Input, DatePicker, Modal, ConfirmModal, LoadingSpinner, useToast } from '../ui';
import { CustomerSearch } from './CustomerSearch';
import { ServiceSelector } from './ServiceSelector';
import type { Customer, Invoice, InvoiceService } from '../../types';
import { formatIndianCurrency } from '../../utils/currency';
import {
  getTodayISO,
  calculateDueDate,
  getInvoiceDateRange,
  isValidInvoiceDate,
} from '../../utils/date';
import {
  validateAmount,
  validateAdvancePayment,
} from '../../utils/validation';
import { calculatePaymentDetails } from '../../utils/payment';
import { getSettings } from '../../services/settingsService';
import { generateTempInvoiceNumber } from '../../services/invoiceService';
import { cn } from '../../lib/utils';

export interface InvoiceFormData {
  invoiceNumber: string;
  customer?: Customer;
  invoiceDate: string;
  dueDate: string;
  services: InvoiceService[];
  totalAmount: number;
  advancePaid: number;
  notes: string;
}

export interface InvoiceFormProps {
  /** Existing invoice for editing (undefined for new invoice) */
  invoice?: Invoice;
  /** Customer to pre-fill for duplication */
  prefillCustomer?: Customer;
  /** Callback when form is submitted */
  onSubmit: (data: InvoiceFormData) => Promise<void>;
  /** Callback when form is cancelled */
  onCancel: () => void;
  /** Whether the form is in loading/submitting state */
  isSubmitting?: boolean;
  /** Callback to request a new invoice number from server */
  onRequestInvoiceNumber?: () => Promise<string>;
}

interface FormErrors {
  customer?: string;
  invoiceDate?: string;
  dueDate?: string;
  services?: string;
  totalAmount?: string;
  advancePaid?: string;
}

// Draft storage key
const DRAFT_STORAGE_KEY = 'candycapture_invoice_draft';
const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const AUTO_SAVE_INTERVAL_MS = 30 * 1000; // 30 seconds

interface StoredDraft {
  data: InvoiceFormData;
  timestamp: number;
  invoiceId?: string;
}

export function InvoiceForm({
  invoice,
  prefillCustomer,
  onSubmit,
  onCancel,
  isSubmitting = false,
  onRequestInvoiceNumber,
}: InvoiceFormProps) {
  const { showToast } = useToast();
  const isEditMode = !!invoice;
  
  // Date range for validation
  const dateRange = useMemo(() => getInvoiceDateRange(), []);

  // Form state
  const [formData, setFormData] = useState<InvoiceFormData>(() => {
    if (invoice) {
      // Edit mode: populate from existing invoice
      return {
        invoiceNumber: invoice.invoiceNumber,
        customer: undefined, // Will be loaded separately
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        services: invoice.services,
        totalAmount: invoice.totalAmount,
        advancePaid: invoice.advancePaid,
        notes: invoice.notes || '',
      };
    }
    // New invoice defaults
    const today = getTodayISO();
    return {
      invoiceNumber: '',
      customer: prefillCustomer,
      invoiceDate: today,
      dueDate: calculateDueDate(today),
      services: [],
      totalAmount: 0,
      advancePaid: 0,
      notes: '',
    };
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoadingNumber, setIsLoadingNumber] = useState(!isEditMode);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [savedDraft, setSavedDraft] = useState<StoredDraft | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');

  // Refs for auto-save
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSavedRef = useRef<string>('');

  // Calculated values
  const { balanceDue, paymentStatus } = useMemo(
    () => calculatePaymentDetails(formData.totalAmount, formData.advancePaid),
    [formData.totalAmount, formData.advancePaid]
  );

  // Load settings for default notes
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSettings();
        if (!isEditMode && !formData.notes) {
          setFormData((prev) => ({ ...prev, notes: settings.defaultNotes }));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, [isEditMode]);

  // Request invoice number for new invoices
  useEffect(() => {
    if (isEditMode || formData.invoiceNumber) return;

    const requestNumber = async () => {
      setIsLoadingNumber(true);
      try {
        let number: string;
        if (onRequestInvoiceNumber) {
          number = await onRequestInvoiceNumber();
        } else {
          // Fallback to temp number for offline mode
          number = generateTempInvoiceNumber();
        }
        setFormData((prev) => ({ ...prev, invoiceNumber: number }));
      } catch (error) {
        console.error('Failed to get invoice number:', error);
        // Use temp number as fallback
        const tempNumber = generateTempInvoiceNumber();
        setFormData((prev) => ({ ...prev, invoiceNumber: tempNumber }));
        showToast(
          'Using temporary invoice number. Permanent number will be assigned on sync.',
          'warning'
        );
      } finally {
        setIsLoadingNumber(false);
      }
    };

    requestNumber();
  }, [isEditMode, onRequestInvoiceNumber, showToast]);

  // Check for existing draft on mount
  useEffect(() => {
    if (isEditMode) return;

    try {
      const storedDraftJson = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (storedDraftJson) {
        const storedDraft: StoredDraft = JSON.parse(storedDraftJson);
        const age = Date.now() - storedDraft.timestamp;

        if (age < DRAFT_MAX_AGE_MS) {
          setSavedDraft(storedDraft);
          setShowDraftModal(true);
        } else {
          // Draft is too old, remove it
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, [isEditMode]);

  // Auto-save draft functionality
  useEffect(() => {
    if (isEditMode) return;

    const saveDraft = () => {
      const dataJson = JSON.stringify(formData);
      // Only save if data has changed
      if (dataJson !== lastSavedRef.current) {
        const draft: StoredDraft = {
          data: formData,
          timestamp: Date.now(),
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
        lastSavedRef.current = dataJson;
      }
    };

    // Start auto-save timer
    autoSaveTimerRef.current = setInterval(saveDraft, AUTO_SAVE_INTERVAL_MS);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [formData, isEditMode]);

  // Handle draft restore
  const handleRestoreDraft = useCallback(() => {
    if (savedDraft) {
      setFormData(savedDraft.data);
      setShowDraftModal(false);
      showToast('Your previous work has been restored.', 'success');
    }
  }, [savedDraft, showToast]);

  // Handle draft discard
  const handleDiscardDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setShowDraftModal(false);
  }, []);

  // Update due date when invoice date changes (only for new invoices)
  const handleInvoiceDateChange = useCallback(
    (date: string) => {
      setFormData((prev) => {
        const newData = { ...prev, invoiceDate: date };
        // Auto-update due date if it hasn't been manually changed
        if (!isEditMode) {
          newData.dueDate = calculateDueDate(date);
        }
        return newData;
      });
      setErrors((prev) => ({ ...prev, invoiceDate: undefined }));
    },
    [isEditMode]
  );

  // Handle field changes
  const handleFieldChange = useCallback(
    <K extends keyof InvoiceFormData>(field: K, value: InvoiceFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    []
  );

  // Handle amount changes with formatting
  const handleAmountChange = useCallback(
    (field: 'totalAmount' | 'advancePaid', value: string) => {
      // Remove currency formatting to get raw number
      const numValue = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
      handleFieldChange(field, numValue);
    },
    [handleFieldChange]
  );

  // Handle customer selection
  const handleCustomerSelect = useCallback((customer: Customer | undefined) => {
    setFormData((prev) => ({ ...prev, customer }));
    setErrors((prev) => ({ ...prev, customer: undefined }));
  }, []);

  // Handle create new customer request
  const handleCreateNewCustomer = useCallback((searchQuery: string) => {
    setNewCustomerName(searchQuery);
    setShowCustomerModal(true);
  }, []);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Customer required
    if (!formData.customer) {
      newErrors.customer = 'Please select or create a customer';
    }

    // Invoice date validation
    if (!formData.invoiceDate) {
      newErrors.invoiceDate = 'Invoice date is required';
    } else if (!isValidInvoiceDate(formData.invoiceDate)) {
      newErrors.invoiceDate = 'Invoice date must be within 1 year past to 2 years future';
    }

    // Due date validation
    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }

    // At least one service required
    if (formData.services.length === 0) {
      newErrors.services = 'At least one service must be selected';
    }

    // Total amount validation
    if (formData.totalAmount <= 0) {
      newErrors.totalAmount = 'Total amount must be greater than zero';
    } else {
      const amountValidation = validateAmount(formData.totalAmount);
      if (!amountValidation.valid) {
        newErrors.totalAmount = amountValidation.error;
      }
    }

    // Advance payment validation
    const advanceValidation = validateAdvancePayment(formData.advancePaid, formData.totalAmount);
    if (!advanceValidation.valid) {
      newErrors.advancePaid = advanceValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        showToast('Please fix the errors before saving.', 'error');
        return;
      }

      try {
        await onSubmit(formData);
        // Clear draft on successful save
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch (error) {
        console.error('Failed to save invoice:', error);
        showToast('Failed to save invoice. Please try again.', 'error');
      }
    },
    [formData, validateForm, onSubmit, showToast]
  );

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Invoice Header */}
        <div className="bg-white rounded-lg border border-surface-200 p-6">
          <h2 className="text-lg font-semibold text-surface-900 mb-4">
            {isEditMode ? 'Edit Invoice' : 'New Invoice'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Invoice Number */}
            <Input
              label="Invoice Number"
              value={formData.invoiceNumber}
              disabled
              fullWidth
              rightIcon={
                isLoadingNumber ? <LoadingSpinner size="sm" /> : undefined
              }
            />

            {/* Invoice Date */}
            <DatePicker
              label="Invoice Date"
              value={formData.invoiceDate}
              onChange={(e) => handleInvoiceDateChange(e.target.value)}
              error={errors.invoiceDate}
              required
              fullWidth
              min={dateRange.minDate}
              max={dateRange.maxDate}
            />

            {/* Due Date */}
            <DatePicker
              label="Due Date"
              value={formData.dueDate}
              onChange={(e) => handleFieldChange('dueDate', e.target.value)}
              error={errors.dueDate}
              required
              fullWidth
              min={formData.invoiceDate}
              max={dateRange.maxDate}
            />
          </div>
        </div>

        {/* Customer Section */}
        <div className="bg-white rounded-lg border border-surface-200 p-6">
          <h3 className="text-lg font-semibold text-surface-900 mb-4">Customer Details</h3>
          <CustomerSearch
            selectedCustomer={formData.customer}
            onSelect={handleCustomerSelect}
            onCreateNew={handleCreateNewCustomer}
            error={errors.customer}
            required
          />

          {/* Display customer details if selected */}
          {formData.customer && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-surface-500">Event:</span>{' '}
                <span className="text-surface-900">{formData.customer.eventType}</span>
              </div>
              <div>
                <span className="text-surface-500">Location:</span>{' '}
                <span className="text-surface-900">{formData.customer.location}</span>
              </div>
            </div>
          )}
        </div>

        {/* Services Section */}
        <div className="bg-white rounded-lg border border-surface-200 p-6">
          <h3 className="text-lg font-semibold text-surface-900 mb-4">Services</h3>
          <ServiceSelector
            selectedServices={formData.services}
            onChange={(services) => handleFieldChange('services', services)}
            error={errors.services}
          />
        </div>

        {/* Payment Section */}
        <div className="bg-white rounded-lg border border-surface-200 p-6">
          <h3 className="text-lg font-semibold text-surface-900 mb-4">Payment Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total Amount */}
            <Input
              label="Total Amount"
              type="number"
              step="0.01"
              min="0.01"
              max="99999999.99"
              value={formData.totalAmount || ''}
              onChange={(e) => handleAmountChange('totalAmount', e.target.value)}
              error={errors.totalAmount}
              required
              fullWidth
              leftIcon={<span className="text-surface-500">₹</span>}
              placeholder="0.00"
            />

            {/* Advance Paid */}
            <Input
              label="Advance Paid"
              type="number"
              step="0.01"
              min="0"
              max={formData.totalAmount}
              value={formData.advancePaid || ''}
              onChange={(e) => handleAmountChange('advancePaid', e.target.value)}
              error={errors.advancePaid}
              fullWidth
              leftIcon={<span className="text-surface-500">₹</span>}
              placeholder="0.00"
            />
          </div>

          {/* Calculated Values */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-primary-50 rounded-md">
              <p className="text-sm text-primary-700">Balance Due</p>
              <p className="text-2xl font-bold text-primary-900">
                {formatIndianCurrency(balanceDue)}
              </p>
            </div>
            <div className="p-4 bg-surface-100 rounded-md">
              <p className="text-sm text-surface-600">Payment Status</p>
              <p
                className={cn(
                  'text-lg font-semibold',
                  paymentStatus === 'PAID' && 'text-status-paid',
                  paymentStatus === 'PARTIALLY_PAID' && 'text-status-partial',
                  paymentStatus === 'PENDING' && 'text-status-pending'
                )}
              >
                {paymentStatus.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-white rounded-lg border border-surface-200 p-6">
          <h3 className="text-lg font-semibold text-surface-900 mb-4">Notes & Terms</h3>
          <textarea
            value={formData.notes}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            className="w-full h-32 px-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            placeholder="Terms and conditions..."
            maxLength={2000}
          />
          <p className="mt-1 text-sm text-surface-500 text-right">
            {formData.notes.length}/2000 characters
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-2 text-surface-700 bg-white border border-surface-300 rounded-md hover:bg-surface-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isLoadingNumber}
            className="px-6 py-2 text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && <LoadingSpinner size="sm" />}
            {isEditMode ? 'Update Invoice' : 'Create Invoice'}
          </button>
        </div>
      </form>

      {/* Draft Restore Modal */}
      <ConfirmModal
        isOpen={showDraftModal}
        onClose={handleDiscardDraft}
        onConfirm={handleRestoreDraft}
        title="Restore Draft?"
        message="We found an unsaved draft from your previous session. Would you like to restore it?"
        confirmText="Restore Draft"
        cancelText="Discard"
        variant="primary"
      />

      {/* Create Customer Modal - placeholder for integration */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="Create New Customer"
        size="md"
      >
        <p className="text-surface-600">
          To create a new customer "{newCustomerName}", please use the Customers page.
        </p>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setShowCustomerModal(false)}
            className="px-4 py-2 text-surface-700 bg-surface-100 rounded-md hover:bg-surface-200 transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>
    </>
  );
}

export default InvoiceForm;
