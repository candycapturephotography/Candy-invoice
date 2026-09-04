/**
 * InvoiceView Component
 *
 * @description Read-only display of full invoice details with action buttons.
 *
 * @requirements 11.8 Display full invoice details in read-only mode
 * @requirements 11.9 Show customer info, services, payment history
 * @requirements 11.10 Edit, Print, Download PDF, Duplicate buttons
 * @requirements 11.11 Print and Download PDF buttons in list
 */

import { useState, useEffect, useCallback } from 'react';
import { PaymentStatusBadge, LoadingSpinner, useToast } from '../ui';
import { PaymentRecorder } from './PaymentRecorder';
import { customerService } from '../../services/customerService';
import { addPayment, deletePayment } from '../../services/invoiceService';
import type { Invoice, Customer, Payment } from '../../types';
import { formatIndianCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';

export interface InvoiceViewProps {
  /** Invoice to display */
  invoice: Invoice;
  /** Callback when edit is requested */
  onEdit: () => void;
  /** Callback when print is requested */
  onPrint: () => void;
  /** Callback when PDF download is requested */
  onDownloadPdf: () => void;
  /** Callback when duplicate is requested */
  onDuplicate: () => void;
  /** Callback when invoice is updated (e.g., after payment) */
  onInvoiceUpdated: (invoice: Invoice) => void;
  /** Callback to close the view */
  onClose: () => void;
}

export function InvoiceView({
  invoice,
  onEdit,
  onPrint,
  onDownloadPdf,
  onDuplicate,
  onInvoiceUpdated,
  onClose,
}: InvoiceViewProps) {
  const { showToast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);
  const [currentInvoice, setCurrentInvoice] = useState(invoice);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Load customer data
  useEffect(() => {
    const loadCustomer = async () => {
      setIsLoadingCustomer(true);
      try {
        const customerData = await customerService.getCustomerById(invoice.customerId);
        setCustomer(customerData || null);
      } catch (error) {
        console.error('Failed to load customer:', error);
      } finally {
        setIsLoadingCustomer(false);
      }
    };

    loadCustomer();
  }, [invoice.customerId]);

  // Update current invoice when prop changes
  useEffect(() => {
    setCurrentInvoice(invoice);
  }, [invoice]);

  // Handle add payment
  const handleAddPayment = useCallback(
    async (paymentData: Omit<Payment, 'id' | 'createdAt'>) => {
      setIsProcessingPayment(true);
      try {
        const payment: Payment = {
          ...paymentData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };

        const updatedInvoice = await addPayment(currentInvoice.id, payment);
        if (updatedInvoice) {
          setCurrentInvoice(updatedInvoice);
          onInvoiceUpdated(updatedInvoice);
          showToast(
            `Payment of ${formatIndianCurrency(paymentData.amount)} recorded.`,
            'success'
          );
        }
      } catch (error) {
        console.error('Failed to add payment:', error);
        showToast('Failed to add payment. Please try again.', 'error');
        throw error;
      } finally {
        setIsProcessingPayment(false);
      }
    },
    [currentInvoice.id, onInvoiceUpdated, showToast]
  );

  // Handle delete payment
  const handleDeletePayment = useCallback(
    async (paymentId: string) => {
      setIsProcessingPayment(true);
      try {
        const updatedInvoice = await deletePayment(currentInvoice.id, paymentId);
        if (updatedInvoice) {
          setCurrentInvoice(updatedInvoice);
          onInvoiceUpdated(updatedInvoice);
          showToast('Payment has been removed and balance recalculated.', 'success');
        }
      } catch (error) {
        console.error('Failed to delete payment:', error);
        showToast('Failed to delete payment. Please try again.', 'error');
        throw error;
      } finally {
        setIsProcessingPayment(false);
      }
    },
    [currentInvoice.id, onInvoiceUpdated, showToast]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">
            Invoice {currentInvoice.invoiceNumber}
          </h2>
          <p className="text-sm text-surface-500 mt-1">
            Created: {formatDate(currentInvoice.createdAt.split('T')[0]!)}
            {currentInvoice.updatedAt !== currentInvoice.createdAt && (
              <> • Updated: {formatDate(currentInvoice.updatedAt.split('T')[0]!)}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PaymentStatusBadge status={currentInvoice.paymentStatus} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-surface-700 bg-white border border-surface-300 rounded-md hover:bg-surface-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Edit
        </button>
        <button
          type="button"
          onClick={onPrint}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-surface-700 bg-white border border-surface-300 rounded-md hover:bg-surface-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Print
        </button>
        <button
          type="button"
          onClick={onDownloadPdf}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download PDF
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-surface-700 bg-white border border-surface-300 rounded-md hover:bg-surface-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Duplicate
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Customer & Services */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg border border-surface-200 p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">Customer Details</h3>
            {isLoadingCustomer ? (
              <div className="flex items-center justify-center p-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : customer ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-surface-500">Name</p>
                  <p className="font-medium text-surface-900">{customer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-surface-500">Mobile</p>
                  <p className="font-medium text-surface-900">{customer.mobile}</p>
                </div>
                {customer.email && (
                  <div>
                    <p className="text-sm text-surface-500">Email</p>
                    <p className="font-medium text-surface-900">{customer.email}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-surface-500">Event</p>
                  <p className="font-medium text-surface-900">{customer.eventType}</p>
                </div>
                <div>
                  <p className="text-sm text-surface-500">Event Date</p>
                  <p className="font-medium text-surface-900">{formatDate(customer.eventDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-surface-500">Location</p>
                  <p className="font-medium text-surface-900">{customer.location}</p>
                </div>
                {customer.address && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-surface-500">Address</p>
                    <p className="font-medium text-surface-900">{customer.address}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-surface-500">Customer information not found.</p>
            )}
          </div>

          {/* Services */}
          <div className="bg-white rounded-lg border border-surface-200 p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">
              Services ({currentInvoice.services.length})
            </h3>
            <div className="border border-surface-200 rounded-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-surface-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                      S.No
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-surface-500 uppercase tracking-wider">
                      Qty
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {currentInvoice.services.map((service, index) => (
                    <tr key={service.id} className="hover:bg-surface-50">
                      <td className="px-4 py-3 text-sm text-surface-900">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-surface-900">{service.name}</td>
                      <td className="px-4 py-3 text-sm text-surface-900 text-center">
                        {service.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {currentInvoice.notes && (
            <div className="bg-white rounded-lg border border-surface-200 p-6">
              <h3 className="text-lg font-semibold text-surface-900 mb-4">Notes & Terms</h3>
              <div className="text-surface-700 whitespace-pre-wrap">{currentInvoice.notes}</div>
            </div>
          )}
        </div>

        {/* Right Column - Payment Details */}
        <div className="space-y-6">
          {/* Invoice Dates */}
          <div className="bg-white rounded-lg border border-surface-200 p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">Invoice Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-surface-500">Invoice Date</span>
                <span className="font-medium text-surface-900">
                  {formatDate(currentInvoice.invoiceDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500">Due Date</span>
                <span className="font-medium text-surface-900">
                  {formatDate(currentInvoice.dueDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white rounded-lg border border-surface-200 p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">Payment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-surface-500">Total Amount</span>
                <span className="font-medium text-surface-900">
                  {formatIndianCurrency(currentInvoice.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500">Advance Paid</span>
                <span className="font-medium text-surface-900">
                  {formatIndianCurrency(currentInvoice.advancePaid)}
                </span>
              </div>
              <div className="border-t border-surface-200 pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-primary-700">Balance Due</span>
                  <span className="font-bold text-primary-700 text-lg">
                    {formatIndianCurrency(currentInvoice.balanceDue)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-lg border border-surface-200 p-6">
            <PaymentRecorder
              invoiceId={currentInvoice.id}
              invoiceDate={currentInvoice.invoiceDate}
              totalAmount={currentInvoice.totalAmount}
              payments={currentInvoice.payments}
              onAddPayment={handleAddPayment}
              onDeletePayment={handleDeletePayment}
              isLoading={isProcessingPayment}
            />
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="flex justify-start">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-surface-600 hover:text-surface-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to List
        </button>
      </div>
    </div>
  );
}

export default InvoiceView;
