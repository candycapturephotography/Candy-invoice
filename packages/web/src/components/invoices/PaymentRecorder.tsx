/**
 * PaymentRecorder Component
 *
 * @description Component for recording and managing invoice payments.
 * Supports adding multiple payments with validation and recalculation.
 *
 * @requirements 7.9 Support up to 50 payments per invoice
 * @requirements 7.10 Recalculate balance and status on payment
 * @requirements 7.11 Validate payment date range
 * @requirements 7.12 Support payment deletion with recalculation
 */

import { useState, useCallback, useMemo } from 'react';
import { Input, DatePicker, Modal, ConfirmModal, LoadingSpinner } from '../ui';
import type { Payment } from '../../types';
import { formatIndianCurrency } from '../../utils/currency';
import { formatDate, getTodayISO, isBefore, isAfter } from '../../utils/date';
import { validateAmount } from '../../utils/validation';

export interface PaymentRecorderProps {
  /** Invoice ID */
  invoiceId: string;
  /** Invoice date (minimum date for payments) */
  invoiceDate: string;
  /** Total invoice amount */
  totalAmount: number;
  /** Current payments */
  payments: Payment[];
  /** Callback when a payment is added */
  onAddPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => Promise<void>;
  /** Callback when a payment is deleted */
  onDeletePayment: (paymentId: string) => Promise<void>;
  /** Whether the component is in read-only mode */
  readOnly?: boolean;
  /** Whether operations are in progress */
  isLoading?: boolean;
}

interface PaymentFormData {
  amount: string;
  paymentDate: string;
}

interface PaymentFormErrors {
  amount?: string;
  paymentDate?: string;
}

const MAX_PAYMENTS = 50;

export function PaymentRecorder({
  invoiceDate,
  totalAmount,
  payments,
  onAddPayment,
  onDeletePayment,
  readOnly = false,
  isLoading = false,
}: PaymentRecorderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: '',
    paymentDate: getTodayISO(),
  });
  const [formErrors, setFormErrors] = useState<PaymentFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate totals
  const totalPaid = useMemo(
    () => payments.reduce((sum, p) => sum + p.amount, 0),
    [payments]
  );

  const balanceDue = useMemo(
    () => Math.max(0, totalAmount - totalPaid),
    [totalAmount, totalPaid]
  );

  const maxPaymentAmount = balanceDue;
  const canAddMorePayments = payments.length < MAX_PAYMENTS && balanceDue > 0;

  // Validate form
  const validateForm = useCallback((): boolean => {
    const errors: PaymentFormErrors = {};
    const today = getTodayISO();

    // Validate amount
    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount)) {
      errors.amount = 'Payment amount is required';
    } else if (amount < 0.01) {
      errors.amount = 'Minimum payment is ₹0.01';
    } else if (amount > maxPaymentAmount) {
      errors.amount = `Maximum payment is ${formatIndianCurrency(maxPaymentAmount)}`;
    } else {
      const amountValidation = validateAmount(amount);
      if (!amountValidation.valid) {
        errors.amount = amountValidation.error;
      }
    }

    // Validate payment date
    if (!formData.paymentDate) {
      errors.paymentDate = 'Payment date is required';
    } else if (isBefore(formData.paymentDate, invoiceDate)) {
      errors.paymentDate = 'Payment date cannot be before invoice date';
    } else if (isAfter(formData.paymentDate, today)) {
      errors.paymentDate = 'Payment date cannot be in the future';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, maxPaymentAmount, invoiceDate]);

  // Handle form input change
  const handleInputChange = useCallback(
    (field: keyof PaymentFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear error on change
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    []
  );

  // Handle add payment
  const handleAddPayment = useCallback(async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onAddPayment({
        amount: parseFloat(formData.amount),
        paymentDate: formData.paymentDate,
      });
      setIsModalOpen(false);
      setFormData({ amount: '', paymentDate: getTodayISO() });
      setFormErrors({});
    } catch (error) {
      console.error('Failed to add payment:', error);
      setFormErrors({ amount: 'Failed to add payment. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onAddPayment]);

  // Handle delete payment
  const handleDeleteClick = useCallback((payment: Payment) => {
    setPaymentToDelete(payment);
    setIsDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!paymentToDelete) return;

    setIsSubmitting(true);
    try {
      await onDeletePayment(paymentToDelete.id);
      setIsDeleteModalOpen(false);
      setPaymentToDelete(null);
    } catch (error) {
      console.error('Failed to delete payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [paymentToDelete, onDeletePayment]);

  // Open add payment modal
  const openAddModal = useCallback(() => {
    setFormData({
      amount: '',
      paymentDate: getTodayISO(),
    });
    setFormErrors({});
    setIsModalOpen(true);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-surface-900">Payment History</h3>
        {!readOnly && canAddMorePayments && (
          <button
            type="button"
            onClick={openAddModal}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Payment
          </button>
        )}
      </div>

      {/* Payments count info */}
      {payments.length >= MAX_PAYMENTS && (
        <p className="text-sm text-amber-600">
          Maximum of {MAX_PAYMENTS} payments reached.
        </p>
      )}

      {/* Payments list */}
      {payments.length > 0 ? (
        <div className="border border-surface-200 rounded-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-surface-500 uppercase tracking-wider">
                  Amount
                </th>
                {!readOnly && (
                  <th className="px-4 py-2 text-right text-xs font-medium text-surface-500 uppercase tracking-wider w-20">
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-surface-50">
                  <td className="px-4 py-3 text-sm text-surface-900">
                    {formatDate(payment.paymentDate)}
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-900 text-right font-medium">
                    {formatIndianCurrency(payment.amount)}
                  </td>
                  {!readOnly && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(payment)}
                        disabled={isLoading}
                        className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                        aria-label="Delete payment"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-surface-50">
              <tr>
                <td className="px-4 py-2 text-sm font-semibold text-surface-700">
                  Total Paid
                </td>
                <td className="px-4 py-2 text-sm font-semibold text-surface-900 text-right">
                  {formatIndianCurrency(totalPaid)}
                </td>
                {!readOnly && <td />}
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="p-6 border border-surface-200 rounded-md bg-surface-50 text-center">
          <p className="text-surface-500">No payments recorded yet.</p>
        </div>
      )}

      {/* Add Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Payment"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-surface-700 bg-white border border-surface-300 rounded-md hover:bg-surface-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddPayment}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && <LoadingSpinner size="sm" />}
              Add Payment
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-surface-600">
            Balance Due: <span className="font-semibold">{formatIndianCurrency(balanceDue)}</span>
          </p>

          <Input
            label="Payment Amount"
            type="number"
            step="0.01"
            min="0.01"
            max={maxPaymentAmount}
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            error={formErrors.amount}
            required
            fullWidth
            leftIcon={<span className="text-surface-500">₹</span>}
            placeholder="0.00"
          />

          <DatePicker
            label="Payment Date"
            value={formData.paymentDate}
            onChange={(e) => handleInputChange('paymentDate', e.target.value)}
            error={formErrors.paymentDate}
            required
            fullWidth
            min={invoiceDate}
            max={getTodayISO()}
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setPaymentToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Payment"
        message={`Are you sure you want to delete this payment of ${paymentToDelete ? formatIndianCurrency(paymentToDelete.amount) : ''}? This will recalculate the balance due.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}

export default PaymentRecorder;
