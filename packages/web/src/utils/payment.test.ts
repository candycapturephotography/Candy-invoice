import { describe, it, expect } from 'vitest';
import {
  calculateBalanceDue,
  calculatePaymentStatus,
  calculatePaymentDetails,
} from './payment';

describe('calculateBalanceDue', () => {
  describe('basic calculation', () => {
    it('should calculate correct balance when no advance is paid', () => {
      expect(calculateBalanceDue(120000, 0)).toBe(120000);
    });

    it('should calculate correct balance when partial advance is paid', () => {
      expect(calculateBalanceDue(120000, 20000)).toBe(100000);
    });

    it('should return 0 when full amount is paid', () => {
      expect(calculateBalanceDue(120000, 120000)).toBe(0);
    });

    it('should return 0 when overpayment occurs (capped at 0)', () => {
      expect(calculateBalanceDue(120000, 150000)).toBe(0);
    });
  });

  describe('decimal precision', () => {
    it('should handle decimal values correctly', () => {
      expect(calculateBalanceDue(100.50, 50.25)).toBe(50.25);
    });

    it('should round to 2 decimal places', () => {
      expect(calculateBalanceDue(100, 33.333)).toBe(66.67);
    });

    it('should handle small decimal values', () => {
      expect(calculateBalanceDue(0.99, 0.49)).toBe(0.5);
    });
  });

  describe('zero amounts', () => {
    it('should return 0 when total amount is 0', () => {
      expect(calculateBalanceDue(0, 0)).toBe(0);
    });

    it('should return 0 when total is 0 but advance is paid (overpayment)', () => {
      expect(calculateBalanceDue(0, 100)).toBe(0);
    });
  });

  describe('negative value handling', () => {
    it('should treat negative total as 0', () => {
      expect(calculateBalanceDue(-100, 50)).toBe(0);
    });

    it('should treat negative advance as 0', () => {
      expect(calculateBalanceDue(100, -50)).toBe(100);
    });

    it('should handle both negative values', () => {
      expect(calculateBalanceDue(-100, -50)).toBe(0);
    });
  });

  describe('input validation', () => {
    it('should throw error for NaN totalAmount', () => {
      expect(() => calculateBalanceDue(NaN, 100)).toThrow('totalAmount must be a finite number');
    });

    it('should throw error for NaN advancePaid', () => {
      expect(() => calculateBalanceDue(100, NaN)).toThrow('advancePaid must be a finite number');
    });

    it('should throw error for Infinity totalAmount', () => {
      expect(() => calculateBalanceDue(Infinity, 100)).toThrow(
        'totalAmount must be a finite number'
      );
    });

    it('should throw error for Infinity advancePaid', () => {
      expect(() => calculateBalanceDue(100, Infinity)).toThrow(
        'advancePaid must be a finite number'
      );
    });

    it('should throw error for non-number totalAmount', () => {
      // @ts-expect-error Testing runtime behavior with invalid input
      expect(() => calculateBalanceDue('100', 50)).toThrow('totalAmount must be a finite number');
    });

    it('should throw error for non-number advancePaid', () => {
      // @ts-expect-error Testing runtime behavior with invalid input
      expect(() => calculateBalanceDue(100, '50')).toThrow('advancePaid must be a finite number');
    });
  });

  describe('requirements validation', () => {
    // Requirement 7.1: Calculate Balance Due as Total Amount minus Advance Paid
    it('should satisfy Requirement 7.1: Balance Due = Total Amount - Advance Paid', () => {
      expect(calculateBalanceDue(120000, 20000)).toBe(100000);
      expect(calculateBalanceDue(50000, 10000)).toBe(40000);
      expect(calculateBalanceDue(75000.50, 25000.25)).toBe(50000.25);
    });

    // Requirement 1.14: BALANCE DUE as TOTAL AMOUNT minus ADVANCE PAID
    it('should satisfy Requirement 1.14: correct balance calculation', () => {
      expect(calculateBalanceDue(100000, 0)).toBe(100000);
      expect(calculateBalanceDue(100000, 50000)).toBe(50000);
      expect(calculateBalanceDue(100000, 100000)).toBe(0);
    });
  });
});

describe('calculatePaymentStatus', () => {
  describe('PENDING status', () => {
    // Requirement 7.2: PENDING when Advance Paid equals zero
    it('should return PENDING when advance paid is 0', () => {
      expect(calculatePaymentStatus(120000, 0)).toBe('PENDING');
    });

    it('should return PENDING for any total amount with zero advance', () => {
      expect(calculatePaymentStatus(100, 0)).toBe('PENDING');
      expect(calculatePaymentStatus(1000000, 0)).toBe('PENDING');
      expect(calculatePaymentStatus(0.01, 0)).toBe('PENDING');
    });
  });

  describe('PARTIALLY_PAID status', () => {
    // Requirement 7.3: PARTIALLY_PAID when Advance Paid > 0 AND < Total Amount
    it('should return PARTIALLY_PAID when advance is partial', () => {
      expect(calculatePaymentStatus(120000, 20000)).toBe('PARTIALLY_PAID');
    });

    it('should return PARTIALLY_PAID for any partial payment', () => {
      expect(calculatePaymentStatus(100, 1)).toBe('PARTIALLY_PAID');
      expect(calculatePaymentStatus(100, 50)).toBe('PARTIALLY_PAID');
      expect(calculatePaymentStatus(100, 99.99)).toBe('PARTIALLY_PAID');
    });

    it('should return PARTIALLY_PAID for very small partial payments', () => {
      expect(calculatePaymentStatus(100000, 0.01)).toBe('PARTIALLY_PAID');
    });
  });

  describe('PAID status', () => {
    // Requirement 7.4: PAID when Advance Paid equals or exceeds Total Amount
    it('should return PAID when advance equals total', () => {
      expect(calculatePaymentStatus(120000, 120000)).toBe('PAID');
    });

    it('should return PAID when advance exceeds total (overpayment)', () => {
      expect(calculatePaymentStatus(120000, 150000)).toBe('PAID');
    });

    it('should return PAID for exact payment', () => {
      expect(calculatePaymentStatus(100.50, 100.50)).toBe('PAID');
    });
  });

  describe('zero total amount', () => {
    it('should return PAID when total amount is 0 (nothing to pay)', () => {
      expect(calculatePaymentStatus(0, 0)).toBe('PAID');
    });

    it('should return PAID when total is 0 with advance (overpayment)', () => {
      expect(calculatePaymentStatus(0, 100)).toBe('PAID');
    });
  });

  describe('negative value handling', () => {
    it('should treat negative total as 0 (returns PAID)', () => {
      expect(calculatePaymentStatus(-100, 0)).toBe('PAID');
    });

    it('should treat negative advance as 0 (returns PENDING)', () => {
      expect(calculatePaymentStatus(100, -50)).toBe('PENDING');
    });
  });

  describe('input validation', () => {
    it('should throw error for NaN totalAmount', () => {
      expect(() => calculatePaymentStatus(NaN, 100)).toThrow(
        'totalAmount must be a finite number'
      );
    });

    it('should throw error for NaN advancePaid', () => {
      expect(() => calculatePaymentStatus(100, NaN)).toThrow(
        'advancePaid must be a finite number'
      );
    });

    it('should throw error for Infinity totalAmount', () => {
      expect(() => calculatePaymentStatus(Infinity, 100)).toThrow(
        'totalAmount must be a finite number'
      );
    });

    it('should throw error for Infinity advancePaid', () => {
      expect(() => calculatePaymentStatus(100, Infinity)).toThrow(
        'advancePaid must be a finite number'
      );
    });

    it('should throw error for non-number totalAmount', () => {
      // @ts-expect-error Testing runtime behavior with invalid input
      expect(() => calculatePaymentStatus('100', 50)).toThrow(
        'totalAmount must be a finite number'
      );
    });

    it('should throw error for non-number advancePaid', () => {
      // @ts-expect-error Testing runtime behavior with invalid input
      expect(() => calculatePaymentStatus(100, '50')).toThrow(
        'advancePaid must be a finite number'
      );
    });
  });

  describe('requirements validation', () => {
    // Requirement 7.2: PENDING when advancePaid = 0
    it('should satisfy Requirement 7.2: PENDING when advancePaid equals zero', () => {
      expect(calculatePaymentStatus(50000, 0)).toBe('PENDING');
      expect(calculatePaymentStatus(1, 0)).toBe('PENDING');
      expect(calculatePaymentStatus(99999999.99, 0)).toBe('PENDING');
    });

    // Requirement 7.3: PARTIALLY_PAID when 0 < advancePaid < totalAmount
    it('should satisfy Requirement 7.3: PARTIALLY_PAID when partial payment', () => {
      expect(calculatePaymentStatus(100, 50)).toBe('PARTIALLY_PAID');
      expect(calculatePaymentStatus(100, 0.01)).toBe('PARTIALLY_PAID');
      expect(calculatePaymentStatus(100, 99.99)).toBe('PARTIALLY_PAID');
    });

    // Requirement 7.4: PAID when advancePaid >= totalAmount
    it('should satisfy Requirement 7.4: PAID when full or overpayment', () => {
      expect(calculatePaymentStatus(100, 100)).toBe('PAID');
      expect(calculatePaymentStatus(100, 101)).toBe('PAID');
      expect(calculatePaymentStatus(100, 200)).toBe('PAID');
    });
  });
});

describe('calculatePaymentDetails', () => {
  describe('combined calculation', () => {
    it('should return both balanceDue and paymentStatus correctly', () => {
      const result = calculatePaymentDetails(120000, 20000);
      expect(result.balanceDue).toBe(100000);
      expect(result.paymentStatus).toBe('PARTIALLY_PAID');
    });

    it('should return PENDING status with full balance', () => {
      const result = calculatePaymentDetails(100000, 0);
      expect(result.balanceDue).toBe(100000);
      expect(result.paymentStatus).toBe('PENDING');
    });

    it('should return PAID status with zero balance', () => {
      const result = calculatePaymentDetails(100000, 100000);
      expect(result.balanceDue).toBe(0);
      expect(result.paymentStatus).toBe('PAID');
    });

    it('should handle overpayment correctly', () => {
      const result = calculatePaymentDetails(100000, 150000);
      expect(result.balanceDue).toBe(0);
      expect(result.paymentStatus).toBe('PAID');
    });
  });

  describe('decimal handling', () => {
    it('should handle decimal values in combined calculation', () => {
      const result = calculatePaymentDetails(100.50, 50.25);
      expect(result.balanceDue).toBe(50.25);
      expect(result.paymentStatus).toBe('PARTIALLY_PAID');
    });
  });

  describe('edge cases', () => {
    it('should handle zero total amount', () => {
      const result = calculatePaymentDetails(0, 0);
      expect(result.balanceDue).toBe(0);
      expect(result.paymentStatus).toBe('PAID');
    });
  });
});
