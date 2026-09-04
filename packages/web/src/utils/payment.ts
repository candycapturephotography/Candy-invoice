/**
 * Payment Calculation Utilities
 *
 * @description Provides payment calculation and status determination functions
 * @requirements 7.1 Calculate Balance Due as Total Amount minus Advance Paid
 * @requirements 7.2 PENDING status when Advance Paid equals zero
 * @requirements 7.3 PARTIALLY_PAID status when Advance Paid > 0 and < Total Amount
 * @requirements 7.4 PAID status when Advance Paid equals or exceeds Total Amount
 * @requirements 1.14 Calculate BALANCE DUE as TOTAL AMOUNT minus ADVANCE PAID
 */

import type { PaymentStatus } from '@/types';

/**
 * Calculates the balance due for an invoice.
 *
 * Balance Due = Total Amount - Advance Paid
 *
 * Edge cases:
 * - If advancePaid > totalAmount (overpayment), balance due is 0
 * - If amounts are negative, they are treated as 0
 * - Result is rounded to 2 decimal places for currency precision
 *
 * @param totalAmount - The total invoice amount (must be >= 0)
 * @param advancePaid - The amount already paid (must be >= 0)
 * @returns The balance due (always >= 0, with 2 decimal precision)
 *
 * @example
 * ```typescript
 * calculateBalanceDue(120000, 20000);   // 100000
 * calculateBalanceDue(120000, 0);       // 120000
 * calculateBalanceDue(120000, 120000);  // 0
 * calculateBalanceDue(120000, 150000);  // 0 (overpayment capped at 0)
 * calculateBalanceDue(100.50, 50.25);   // 50.25
 * ```
 *
 * @throws {Error} If totalAmount or advancePaid is not a finite number
 */
export function calculateBalanceDue(
  totalAmount: number,
  advancePaid: number
): number {
  // Validate inputs
  if (typeof totalAmount !== 'number' || !Number.isFinite(totalAmount)) {
    throw new Error('totalAmount must be a finite number');
  }
  if (typeof advancePaid !== 'number' || !Number.isFinite(advancePaid)) {
    throw new Error('advancePaid must be a finite number');
  }

  // Treat negative values as 0
  const normalizedTotal = Math.max(0, totalAmount);
  const normalizedAdvance = Math.max(0, advancePaid);

  // Calculate balance, ensuring it's never negative (overpayment scenario)
  const balance = normalizedTotal - normalizedAdvance;
  const clampedBalance = Math.max(0, balance);

  // Round to 2 decimal places for currency precision
  return Math.round(clampedBalance * 100) / 100;
}

/**
 * Determines the payment status based on total amount and advance paid.
 *
 * Status determination rules:
 * - PENDING: advancePaid === 0
 * - PARTIALLY_PAID: advancePaid > 0 AND advancePaid < totalAmount
 * - PAID: advancePaid >= totalAmount
 *
 * @param totalAmount - The total invoice amount (must be >= 0)
 * @param advancePaid - The amount already paid (must be >= 0)
 * @returns The payment status: 'PENDING', 'PARTIALLY_PAID', or 'PAID'
 *
 * @example
 * ```typescript
 * calculatePaymentStatus(120000, 0);       // 'PENDING'
 * calculatePaymentStatus(120000, 20000);   // 'PARTIALLY_PAID'
 * calculatePaymentStatus(120000, 120000);  // 'PAID'
 * calculatePaymentStatus(120000, 150000);  // 'PAID' (overpayment counts as paid)
 * calculatePaymentStatus(0, 0);            // 'PAID' (zero amount is fully paid)
 * ```
 *
 * @throws {Error} If totalAmount or advancePaid is not a finite number
 */
export function calculatePaymentStatus(
  totalAmount: number,
  advancePaid: number
): PaymentStatus {
  // Validate inputs
  if (typeof totalAmount !== 'number' || !Number.isFinite(totalAmount)) {
    throw new Error('totalAmount must be a finite number');
  }
  if (typeof advancePaid !== 'number' || !Number.isFinite(advancePaid)) {
    throw new Error('advancePaid must be a finite number');
  }

  // Treat negative values as 0
  const normalizedTotal = Math.max(0, totalAmount);
  const normalizedAdvance = Math.max(0, advancePaid);

  // Special case: if total amount is 0, invoice is considered PAID
  // (there's nothing to pay)
  if (normalizedTotal === 0) {
    return 'PAID';
  }

  // Determine status based on payment rules
  if (normalizedAdvance === 0) {
    return 'PENDING';
  }

  if (normalizedAdvance >= normalizedTotal) {
    return 'PAID';
  }

  return 'PARTIALLY_PAID';
}

/**
 * Calculates both balance due and payment status in a single call.
 *
 * This is a convenience function that returns both values together,
 * useful when updating invoice records.
 *
 * @param totalAmount - The total invoice amount (must be >= 0)
 * @param advancePaid - The amount already paid (must be >= 0)
 * @returns An object containing balanceDue and paymentStatus
 *
 * @example
 * ```typescript
 * const { balanceDue, paymentStatus } = calculatePaymentDetails(120000, 20000);
 * // balanceDue: 100000, paymentStatus: 'PARTIALLY_PAID'
 * ```
 *
 * @throws {Error} If totalAmount or advancePaid is not a finite number
 */
export function calculatePaymentDetails(
  totalAmount: number,
  advancePaid: number
): { balanceDue: number; paymentStatus: PaymentStatus } {
  return {
    balanceDue: calculateBalanceDue(totalAmount, advancePaid),
    paymentStatus: calculatePaymentStatus(totalAmount, advancePaid),
  };
}
