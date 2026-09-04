import { describe, it, expect } from 'vitest';
import { formatIndianCurrency, parseIndianCurrency } from './currency';

describe('formatIndianCurrency', () => {
  describe('basic formatting', () => {
    it('should format zero correctly', () => {
      expect(formatIndianCurrency(0)).toBe('₹0.00');
    });

    it('should format small numbers (< 1000) correctly', () => {
      expect(formatIndianCurrency(1)).toBe('₹1.00');
      expect(formatIndianCurrency(10)).toBe('₹10.00');
      expect(formatIndianCurrency(100)).toBe('₹100.00');
      expect(formatIndianCurrency(999)).toBe('₹999.00');
    });

    it('should format thousands correctly', () => {
      expect(formatIndianCurrency(1000)).toBe('₹1,000.00');
      expect(formatIndianCurrency(9999)).toBe('₹9,999.00');
    });

    it('should format ten thousands correctly', () => {
      expect(formatIndianCurrency(10000)).toBe('₹10,000.00');
      expect(formatIndianCurrency(99999)).toBe('₹99,999.00');
    });
  });

  describe('Indian numbering system (lakhs and crores)', () => {
    it('should format 1 lakh (100,000) correctly', () => {
      expect(formatIndianCurrency(100000)).toBe('₹1,00,000.00');
    });

    it('should format amounts in lakhs correctly', () => {
      expect(formatIndianCurrency(120000)).toBe('₹1,20,000.00');
      expect(formatIndianCurrency(999999)).toBe('₹9,99,999.00');
    });

    it('should format 10 lakhs (1,000,000) correctly', () => {
      expect(formatIndianCurrency(1000000)).toBe('₹10,00,000.00');
    });

    it('should format 1 crore (10,000,000) correctly', () => {
      expect(formatIndianCurrency(10000000)).toBe('₹1,00,00,000.00');
    });

    it('should format large amounts correctly', () => {
      expect(formatIndianCurrency(99999999.99)).toBe('₹9,99,99,999.99');
      expect(formatIndianCurrency(12345678.90)).toBe('₹1,23,45,678.90');
    });
  });

  describe('decimal handling', () => {
    it('should always show exactly 2 decimal places', () => {
      expect(formatIndianCurrency(100)).toBe('₹100.00');
      expect(formatIndianCurrency(100.1)).toBe('₹100.10');
      expect(formatIndianCurrency(100.12)).toBe('₹100.12');
    });

    it('should round to 2 decimal places', () => {
      expect(formatIndianCurrency(100.125)).toBe('₹100.13');
      expect(formatIndianCurrency(100.124)).toBe('₹100.12');
      expect(formatIndianCurrency(99.999)).toBe('₹100.00');
    });

    it('should handle small decimal values', () => {
      expect(formatIndianCurrency(0.01)).toBe('₹0.01');
      expect(formatIndianCurrency(0.99)).toBe('₹0.99');
    });
  });

  describe('negative amounts', () => {
    it('should format negative amounts correctly', () => {
      expect(formatIndianCurrency(-100)).toBe('-₹100.00');
      expect(formatIndianCurrency(-5000)).toBe('-₹5,000.00');
      expect(formatIndianCurrency(-120000)).toBe('-₹1,20,000.00');
      expect(formatIndianCurrency(-1000000)).toBe('-₹10,00,000.00');
    });
  });

  describe('edge cases from requirements', () => {
    // Examples from task description
    it('should match task example: 120000 → "₹1,20,000.00"', () => {
      expect(formatIndianCurrency(120000)).toBe('₹1,20,000.00');
    });

    it('should match task example: 1000000 → "₹10,00,000.00"', () => {
      expect(formatIndianCurrency(1000000)).toBe('₹10,00,000.00');
    });

    it('should match task example: 100 → "₹100.00"', () => {
      expect(formatIndianCurrency(100)).toBe('₹100.00');
    });

    it('should match task example: 99999999.99 → "₹9,99,99,999.99"', () => {
      expect(formatIndianCurrency(99999999.99)).toBe('₹9,99,99,999.99');
    });
  });

  describe('input validation', () => {
    it('should throw error for NaN', () => {
      expect(() => formatIndianCurrency(NaN)).toThrow('Amount must be a finite number');
    });

    it('should throw error for Infinity', () => {
      expect(() => formatIndianCurrency(Infinity)).toThrow('Amount must be a finite number');
      expect(() => formatIndianCurrency(-Infinity)).toThrow('Amount must be a finite number');
    });

    it('should throw error for non-number types', () => {
      // @ts-expect-error Testing runtime behavior with invalid input
      expect(() => formatIndianCurrency('100')).toThrow('Amount must be a finite number');
      // @ts-expect-error Testing runtime behavior with invalid input
      expect(() => formatIndianCurrency(null)).toThrow('Amount must be a finite number');
      // @ts-expect-error Testing runtime behavior with invalid input
      expect(() => formatIndianCurrency(undefined)).toThrow('Amount must be a finite number');
    });
  });

  describe('additional Indian numbering verification', () => {
    // Verify the comma placement pattern for various magnitudes
    it('should place commas correctly for various magnitudes', () => {
      // 4 digits: X,XXX
      expect(formatIndianCurrency(1234)).toBe('₹1,234.00');

      // 5 digits: XX,XXX
      expect(formatIndianCurrency(12345)).toBe('₹12,345.00');

      // 6 digits: X,XX,XXX
      expect(formatIndianCurrency(123456)).toBe('₹1,23,456.00');

      // 7 digits: XX,XX,XXX
      expect(formatIndianCurrency(1234567)).toBe('₹12,34,567.00');

      // 8 digits: X,XX,XX,XXX
      expect(formatIndianCurrency(12345678)).toBe('₹1,23,45,678.00');

      // 9 digits: XX,XX,XX,XXX
      expect(formatIndianCurrency(123456789)).toBe('₹12,34,56,789.00');
    });
  });
});

describe('parseIndianCurrency', () => {
  describe('parsing formatted amounts', () => {
    it('should parse basic formatted amounts', () => {
      expect(parseIndianCurrency('₹100.00')).toBe(100);
      expect(parseIndianCurrency('₹1,000.00')).toBe(1000);
      expect(parseIndianCurrency('₹1,20,000.00')).toBe(120000);
      expect(parseIndianCurrency('₹10,00,000.00')).toBe(1000000);
    });

    it('should parse negative amounts', () => {
      expect(parseIndianCurrency('-₹5,000.00')).toBe(-5000);
      expect(parseIndianCurrency('-₹1,20,000.00')).toBe(-120000);
    });

    it('should parse zero', () => {
      expect(parseIndianCurrency('₹0.00')).toBe(0);
    });

    it('should parse decimal values', () => {
      expect(parseIndianCurrency('₹100.50')).toBe(100.5);
      expect(parseIndianCurrency('₹1,23,456.78')).toBe(123456.78);
    });
  });

  describe('round-trip consistency', () => {
    it('should parse back what formatIndianCurrency produces', () => {
      const testValues = [0, 100, 1000, 12345, 120000, 1000000, 99999999.99];
      
      for (const value of testValues) {
        const formatted = formatIndianCurrency(value);
        const parsed = parseIndianCurrency(formatted);
        expect(parsed).toBeCloseTo(value, 2);
      }
    });
  });

  describe('error handling', () => {
    it('should return NaN for invalid input', () => {
      expect(parseIndianCurrency('')).toBeNaN();
      expect(parseIndianCurrency('invalid')).toBeNaN();
      expect(parseIndianCurrency('₹')).toBeNaN();
    });

    it('should return NaN for non-string input', () => {
      // @ts-expect-error Testing runtime behavior with invalid input
      expect(parseIndianCurrency(100)).toBeNaN();
      // @ts-expect-error Testing runtime behavior with invalid input
      expect(parseIndianCurrency(null)).toBeNaN();
      // @ts-expect-error Testing runtime behavior with invalid input
      expect(parseIndianCurrency(undefined)).toBeNaN();
    });
  });

  describe('flexible parsing', () => {
    it('should handle amounts without commas', () => {
      expect(parseIndianCurrency('₹100000')).toBe(100000);
    });

    it('should handle amounts with spaces', () => {
      expect(parseIndianCurrency(' ₹100.00 ')).toBe(100);
    });
  });
});
