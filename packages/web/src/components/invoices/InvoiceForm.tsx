/**
 * InvoiceForm Component
 *
 * @description Main form component for creating invoices with integrated customer creation.
 * The invoice page is the PRIMARY data entry point - customers are created automatically
 * when generating an invoice if they don't already exist.
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
import { Input, DatePicker, ConfirmModal, LoadingSpinner, useToast } from '../ui';
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
  validateMobileNumber,
  validateEmail,
} from '../../utils/validation';
import { calculatePaymentDetails } from '../../utils/payment';
import { getSettings } from '../../services/settingsService';
import { generateTempInvoiceNumber } from '../../services/invoiceService';
import { customerService } from '../../services/customerService';
import { cn } from '../../lib/utils';

/**
 * Form data structure for the new invoice workflow
 * Contains all customer details inline - no pre-existing customer required
 */
export interface InvoiceFormData {
  invoiceNumber: string;
  // Customer details - entered directly, not requiring pre-existing customer
  customerName: string;
  customerMobile: string;
  customerEmail?: string;
  existingCustomerId?: string; // Set if an existing customer was selected
  // Event details
  eventType: string;
  eventDate: string;
  eventLocation: string;
  // Invoice details
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
  /** Customer to pre-fill (for editing existing invoices) */
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
  customerName?: string;
  customerMobile?: string;
  customerEmail?: string;
  eventType?: string;
  eventDate?: string;
  eventLocation?: string;
  invoiceDate?: string;
  dueDate?: string;
  services?: string;
  totalAmount?: string;
  advancePaid?: string;
}

interface CustomerSearchResult {
  customer: Customer;
  matchType: 'name' | 'mobile';
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

// Common event types for quick selection
const COMMON_EVENT_TYPES = [
  'Wedding',
  'Birthday',
  'Reception',
  'Engagement',
  'Baby Shower',
  'Corporate Event',
  'Anniversary',
  'Other',
];

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
    const today = getTodayISO();
    if (invoice && prefillCustomer) {
      // Edit mode: populate from existing invoice and customer
      return {
        invoiceNumber: invoice.invoiceNumber,
        customerName: prefillCustomer.name,
        customerMobile: prefillCustomer.mobile,
        customerEmail: prefillCustomer.email,
        existingCustomerId: prefillCustomer.id,
        eventType: prefillCustomer.eventType,
        eventDate: prefillCustomer.eventDate,
        eventLocation: prefillCustomer.location,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        services: invoice.services,
        totalAmount: invoice.totalAmount,
        advancePaid: invoice.advancePaid,
        notes: invoice.notes || '',
      };
    }
    // New invoice defaults
    return {
      invoiceNumber: '',
      customerName: '',
      customerMobile: '',
      customerEmail: '',
      existingCustomerId: undefined,
      eventType: '',
      eventDate: today,
      eventLocation: '',
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

  // Customer search state
  const [customerSearchResults, setCustomerSearchResults] = useState<CustomerSearchResult[]>([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [focusedSearchIndex, setFocusedSearchIndex] = useState(-1);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const customerSearchRef = useRef<HTMLDivElement>(null);

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
  }, [isEditMode, onRequestInvoiceNumber, showToast, formData.invoiceNumber]);

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

  // Close customer dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        customerSearchRef.current &&
        !customerSearchRef.current.contains(event.target as Node)
      ) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Search customers by name or mobile
  const searchCustomers = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
      return;
    }

    setIsSearchingCustomers(true);
    try {
      const customers = await customerService.searchCustomers(query);
      const results: CustomerSearchResult[] = customers.map((customer) => ({
        customer,
        matchType: customer.mobile.includes(query) ? 'mobile' : 'name',
      }));
      setCustomerSearchResults(results);
      setShowCustomerDropdown(results.length > 0);
      setFocusedSearchIndex(-1);
    } catch (error) {
      console.error('Customer search failed:', error);
      setCustomerSearchResults([]);
    } finally {
      setIsSearchingCustomers(false);
    }
  }, []);

  // Handle customer name input change with debounced search
  const handleCustomerNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFormData((prev) => ({
        ...prev,
        customerName: value,
        existingCustomerId: undefined, // Clear existing customer link when typing
      }));
      setErrors((prev) => ({ ...prev, customerName: undefined }));

      // Clear pending search
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Debounce search
      searchTimeoutRef.current = setTimeout(() => {
        searchCustomers(value);
      }, 300);
    },
    [searchCustomers]
  );

  // Handle mobile input change with debounced search
  const handleMobileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/\D/g, '').slice(0, 10); // Only digits, max 10
      setFormData((prev) => ({
        ...prev,
        customerMobile: value,
        existingCustomerId: undefined, // Clear existing customer link when typing
      }));
      setErrors((prev) => ({ ...prev, customerMobile: undefined }));

      // Clear pending search
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Debounce search by mobile
      searchTimeoutRef.current = setTimeout(() => {
        searchCustomers(value);
      }, 300);
    },
    [searchCustomers]
  );

  // Handle selecting an existing customer from search results
  const handleSelectCustomer = useCallback((customer: Customer) => {
    setFormData((prev) => ({
      ...prev,
      customerName: customer.name,
      customerMobile: customer.mobile,
      customerEmail: customer.email || '',
      existingCustomerId: customer.id,
      eventType: customer.eventType,
      eventDate: customer.eventDate,
      eventLocation: customer.location,
    }));
    setShowCustomerDropdown(false);
    setCustomerSearchResults([]);
    setErrors((prev) => ({
      ...prev,
      customerName: undefined,
      customerMobile: undefined,
      eventType: undefined,
      eventDate: undefined,
      eventLocation: undefined,
    }));
  }, []);

  // Handle keyboard navigation in customer search
  const handleCustomerSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showCustomerDropdown) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedSearchIndex((prev) =>
            prev < customerSearchResults.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedSearchIndex((prev) =>
            prev > 0 ? prev - 1 : customerSearchResults.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedSearchIndex >= 0 && focusedSearchIndex < customerSearchResults.length) {
            handleSelectCustomer(customerSearchResults[focusedSearchIndex]!.customer);
          }
          break;
        case 'Escape':
          setShowCustomerDropdown(false);
          setFocusedSearchIndex(-1);
          break;
      }
    },
    [showCustomerDropdown, customerSearchResults, focusedSearchIndex, handleSelectCustomer]
  );

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

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Customer name required
    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }

    // Mobile number validation
    if (!formData.customerMobile) {
      newErrors.customerMobile = 'Mobile number is required';
    } else {
      const mobileValidation = validateMobileNumber(formData.customerMobile);
      if (!mobileValidation.valid) {
        newErrors.customerMobile = mobileValidation.error;
      }
    }

    // Email validation (optional but must be valid if provided)
    if (formData.customerEmail) {
      const emailValidation = validateEmail(formData.customerEmail);
      if (!emailValidation.valid) {
        newErrors.customerEmail = emailValidation.error;
      }
    }

    // Event type required
    if (!formData.eventType.trim()) {
      newErrors.eventType = 'Event type is required';
    }

    // Event date required
    if (!formData.eventDate) {
      newErrors.eventDate = 'Event date is required';
    }

    // Event location required
    if (!formData.eventLocation.trim()) {
      newErrors.eventLocation = 'Event location is required';
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
    const advanceValidation = validateAdvancePayment(
      formData.advancePaid,
      formData.totalAmount
    );
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
        showToast('Please fix the errors before generating the invoice.', 'error');
        return;
      }

      try {
        await onSubmit(formData);
        // Clear draft on successful save
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch (error) {
        console.error('Failed to generate invoice:', error);
        showToast('Failed to generate invoice. Please try again.', 'error');
      }
    },
    [formData, validateForm, onSubmit, showToast]
  );

  // Clear linked customer when editing customer fields manually
  const handleClearLinkedCustomer = useCallback(() => {
    setFormData((prev) => ({ ...prev, existingCustomerId: undefined }));
  }, []);

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
              rightIcon={isLoadingNumber ? <LoadingSpinner size="sm" /> : undefined}
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

        {/* Customer Section - Inline entry with autocomplete */}
        <div className="bg-white rounded-lg border border-surface-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-surface-900">Customer Details</h3>
            {formData.existingCustomerId && (
              <span className="text-sm text-primary-600 bg-primary-50 px-2 py-1 rounded">
                Linked to existing customer
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer Name with autocomplete */}
            <div ref={customerSearchRef} className="relative">
              <Input
                label="Customer Name"
                value={formData.customerName}
                onChange={handleCustomerNameChange}
                onKeyDown={handleCustomerSearchKeyDown}
                onFocus={() => {
                  if (customerSearchResults.length > 0) {
                    setShowCustomerDropdown(true);
                  }
                }}
                error={errors.customerName}
                required
                fullWidth
                placeholder="Search or enter new name..."
                autoComplete="off"
                rightIcon={isSearchingCustomers ? <LoadingSpinner size="sm" /> : undefined}
              />

              {/* Customer search dropdown */}
              {showCustomerDropdown && customerSearchResults.length > 0 && (
                <ul
                  role="listbox"
                  className="absolute z-20 w-full mt-1 max-h-48 overflow-auto bg-white border border-surface-200 rounded-md shadow-lg"
                >
                  {customerSearchResults.map((result, index) => (
                    <li
                      key={result.customer.id}
                      role="option"
                      aria-selected={focusedSearchIndex === index}
                      onClick={() => handleSelectCustomer(result.customer)}
                      onMouseEnter={() => setFocusedSearchIndex(index)}
                      className={cn(
                        'px-3 py-2 cursor-pointer transition-colors',
                        focusedSearchIndex === index
                          ? 'bg-primary-50 text-primary-900'
                          : 'hover:bg-surface-50'
                      )}
                    >
                      <p className="font-medium text-surface-900">
                        {result.customer.name}
                      </p>
                      <p className="text-sm text-surface-600">
                        {result.customer.mobile} • {result.customer.eventType} •{' '}
                        {result.customer.location}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Mobile Number */}
            <Input
              label="Mobile Number"
              value={formData.customerMobile}
              onChange={handleMobileChange}
              onKeyDown={handleCustomerSearchKeyDown}
              error={errors.customerMobile}
              required
              fullWidth
              placeholder="10-digit mobile number"
              maxLength={10}
              inputMode="numeric"
            />

            {/* Email (Optional) */}
            <Input
              label="Email"
              type="email"
              value={formData.customerEmail || ''}
              onChange={(e) => {
                handleFieldChange('customerEmail', e.target.value);
                handleClearLinkedCustomer();
              }}
              error={errors.customerEmail}
              fullWidth
              placeholder="Optional"
            />
          </div>
        </div>

        {/* Event Section */}
        <div className="bg-white rounded-lg border border-surface-200 p-6">
          <h3 className="text-lg font-semibold text-surface-900 mb-4">Event Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Event Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-surface-700">
                Event Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  list="event-types"
                  value={formData.eventType}
                  onChange={(e) => {
                    handleFieldChange('eventType', e.target.value);
                    handleClearLinkedCustomer();
                  }}
                  className={cn(
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                    errors.eventType
                      ? 'border-red-500'
                      : 'border-surface-300'
                  )}
                  placeholder="e.g., Wedding, Birthday"
                />
                <datalist id="event-types">
                  {COMMON_EVENT_TYPES.map((type) => (
                    <option key={type} value={type} />
                  ))}
                </datalist>
              </div>
              {errors.eventType && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.eventType}
                </p>
              )}
            </div>

            {/* Event Date */}
            <DatePicker
              label="Event Date"
              value={formData.eventDate}
              onChange={(e) => {
                handleFieldChange('eventDate', e.target.value);
                handleClearLinkedCustomer();
              }}
              error={errors.eventDate}
              required
              fullWidth
            />

            {/* Event Location */}
            <Input
              label="Event Location"
              value={formData.eventLocation}
              onChange={(e) => {
                handleFieldChange('eventLocation', e.target.value);
                handleClearLinkedCustomer();
              }}
              error={errors.eventLocation}
              required
              fullWidth
              placeholder="e.g., Sivakasi, Chennai"
            />
          </div>
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
              label="Total Package Amount"
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
            {isEditMode ? 'Update Invoice' : 'Generate Invoice'}
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
    </>
  );
}

export default InvoiceForm;
