import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDate,
  formatDateISO,
  calculateDueDate,
  getTodayISO,
  isDateInRange,
  addDays,
  subtractYears,
  addYears,
  getInvoiceDateRange,
  isValidInvoiceDate,
  parseISODate,
  isValidDate,
  compareDates,
  isToday,
  isBefore,
  isAfter,
  isSameDay,
  daysBetween,
  DEFAULT_DUE_DATE_OFFSET_DAYS,
  DATE_RANGE_YEARS_BEFORE,
  DATE_RANGE_YEARS_AFTER,
} from './date';

describe('date utilities', () => {
  describe('formatDate', () => {
    it('should format ISO date string to Indian format DD-Mon-YYYY', () => {
      expect(formatDate('2026-11-20')).toBe('20-Nov-2026');
      expect(formatDate('2026-09-03')).toBe('03-Sep-2026');
      expect(formatDate('2026-01-15')).toBe('15-Jan-2026');
      expect(formatDate('2026-12-01')).toBe('01-Dec-2026');
    });

    it('should format Date object to Indian format', () => {
      expect(formatDate(new Date(2026, 10, 20))).toBe('20-Nov-2026'); // Month is 0-indexed
      expect(formatDate(new Date(2026, 8, 3))).toBe('03-Sep-2026');
    });

    it('should pad single digit days with leading zero', () => {
      expect(formatDate('2026-03-05')).toBe('05-Mar-2026');
      expect(formatDate('2026-07-01')).toBe('01-Jul-2026');
    });

    it('should handle all months correctly', () => {
      expect(formatDate('2026-01-15')).toBe('15-Jan-2026');
      expect(formatDate('2026-02-15')).toBe('15-Feb-2026');
      expect(formatDate('2026-03-15')).toBe('15-Mar-2026');
      expect(formatDate('2026-04-15')).toBe('15-Apr-2026');
      expect(formatDate('2026-05-15')).toBe('15-May-2026');
      expect(formatDate('2026-06-15')).toBe('15-Jun-2026');
      expect(formatDate('2026-07-15')).toBe('15-Jul-2026');
      expect(formatDate('2026-08-15')).toBe('15-Aug-2026');
      expect(formatDate('2026-09-15')).toBe('15-Sep-2026');
      expect(formatDate('2026-10-15')).toBe('15-Oct-2026');
      expect(formatDate('2026-11-15')).toBe('15-Nov-2026');
      expect(formatDate('2026-12-15')).toBe('15-Dec-2026');
    });

    it('should throw error for invalid date string', () => {
      expect(() => formatDate('invalid-date')).toThrow('Invalid date');
      expect(() => formatDate('2026-13-01')).toThrow('Invalid date');
      expect(() => formatDate('')).toThrow('Invalid date');
    });
  });

  describe('formatDateISO', () => {
    it('should format Date object to ISO format YYYY-MM-DD', () => {
      expect(formatDateISO(new Date(2026, 10, 20))).toBe('2026-11-20');
      expect(formatDateISO(new Date(2026, 8, 3))).toBe('2026-09-03');
      expect(formatDateISO(new Date(2026, 0, 1))).toBe('2026-01-01');
    });

    it('should pad single digit months and days with leading zeros', () => {
      expect(formatDateISO(new Date(2026, 0, 5))).toBe('2026-01-05');
      expect(formatDateISO(new Date(2026, 6, 9))).toBe('2026-07-09');
    });

    it('should throw error for invalid date', () => {
      expect(() => formatDateISO(new Date(NaN))).toThrow('Invalid date');
      expect(() => formatDateISO(new Date('invalid'))).toThrow('Invalid date');
    });
  });

  describe('calculateDueDate', () => {
    it('should calculate due date with default 15 days offset', () => {
      expect(calculateDueDate('2026-09-03')).toBe('2026-09-18');
      expect(calculateDueDate('2026-11-20')).toBe('2026-12-05');
    });

    it('should calculate due date with custom offset', () => {
      expect(calculateDueDate('2026-09-03', 15)).toBe('2026-09-18');
      expect(calculateDueDate('2026-11-20', 30)).toBe('2026-12-20');
      expect(calculateDueDate('2026-01-01', 7)).toBe('2026-01-08');
    });

    it('should handle month boundaries correctly', () => {
      expect(calculateDueDate('2026-02-27', 3)).toBe('2026-03-02');
      expect(calculateDueDate('2026-01-31', 1)).toBe('2026-02-01');
    });

    it('should handle year boundaries correctly', () => {
      expect(calculateDueDate('2026-12-20', 15)).toBe('2027-01-04');
      expect(calculateDueDate('2026-12-31', 1)).toBe('2027-01-01');
    });

    it('should accept Date object as input', () => {
      expect(calculateDueDate(new Date(2026, 8, 3), 15)).toBe('2026-09-18');
    });

    it('should throw error for invalid date', () => {
      expect(() => calculateDueDate('invalid-date')).toThrow('Invalid invoice date');
    });

    it('should have default offset of 15 days', () => {
      expect(DEFAULT_DUE_DATE_OFFSET_DAYS).toBe(15);
    });
  });

  describe('getTodayISO', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return today date in ISO format', () => {
      vi.setSystemTime(new Date(2026, 8, 3)); // Sept 3, 2026
      expect(getTodayISO()).toBe('2026-09-03');
    });

    it('should handle different dates correctly', () => {
      vi.setSystemTime(new Date(2026, 0, 1)); // Jan 1, 2026
      expect(getTodayISO()).toBe('2026-01-01');

      vi.setSystemTime(new Date(2026, 11, 31)); // Dec 31, 2026
      expect(getTodayISO()).toBe('2026-12-31');
    });
  });

  describe('isDateInRange', () => {
    it('should return true for date within range', () => {
      expect(isDateInRange('2026-06-15', '2026-01-01', '2026-12-31')).toBe(true);
      expect(isDateInRange('2026-06-15', '2026-06-01', '2026-06-30')).toBe(true);
    });

    it('should return true for date at range boundaries (inclusive)', () => {
      expect(isDateInRange('2026-01-01', '2026-01-01', '2026-12-31')).toBe(true);
      expect(isDateInRange('2026-12-31', '2026-01-01', '2026-12-31')).toBe(true);
    });

    it('should return false for date outside range', () => {
      expect(isDateInRange('2025-01-01', '2026-01-01', '2026-12-31')).toBe(false);
      expect(isDateInRange('2027-01-01', '2026-01-01', '2026-12-31')).toBe(false);
    });

    it('should handle Date objects', () => {
      expect(isDateInRange(new Date(2026, 5, 15), new Date(2026, 0, 1), new Date(2026, 11, 31))).toBe(true);
    });

    it('should return false for invalid dates', () => {
      expect(isDateInRange('invalid', '2026-01-01', '2026-12-31')).toBe(false);
      expect(isDateInRange('2026-06-15', 'invalid', '2026-12-31')).toBe(false);
      expect(isDateInRange('2026-06-15', '2026-01-01', 'invalid')).toBe(false);
    });
  });

  describe('addDays', () => {
    it('should add positive days to a date', () => {
      const result = addDays(new Date(2026, 8, 3), 15);
      expect(formatDateISO(result)).toBe('2026-09-18');
    });

    it('should handle negative days (subtraction)', () => {
      const result = addDays(new Date(2026, 8, 18), -15);
      expect(formatDateISO(result)).toBe('2026-09-03');
    });

    it('should handle month boundaries', () => {
      const result = addDays(new Date(2026, 1, 27), 3); // Feb 27 + 3 days
      expect(formatDateISO(result)).toBe('2026-03-02');
    });

    it('should handle year boundaries', () => {
      const result = addDays(new Date(2026, 11, 30), 5); // Dec 30 + 5 days
      expect(formatDateISO(result)).toBe('2027-01-04');
    });

    it('should accept ISO string input', () => {
      const result = addDays('2026-09-03', 15);
      expect(formatDateISO(result)).toBe('2026-09-18');
    });

    it('should return a new Date object', () => {
      const original = new Date(2026, 8, 3);
      const result = addDays(original, 15);
      expect(result).not.toBe(original);
      expect(formatDateISO(original)).toBe('2026-09-03'); // Original unchanged
    });

    it('should throw error for invalid date', () => {
      expect(() => addDays('invalid', 5)).toThrow('Invalid date');
    });
  });

  describe('subtractYears', () => {
    it('should subtract years from a date', () => {
      const result = subtractYears(new Date(2026, 8, 3), 1);
      expect(formatDateISO(result)).toBe('2025-09-03');
    });

    it('should accept ISO string input', () => {
      const result = subtractYears('2026-09-03', 2);
      expect(formatDateISO(result)).toBe('2024-09-03');
    });

    it('should handle leap year Feb 29 when target year has no Feb 29', () => {
      // 2024 is a leap year, 2023 is not
      const result = subtractYears('2024-02-29', 1);
      expect(formatDateISO(result)).toBe('2023-02-28');
    });

    it('should handle leap year Feb 29 when target year also has Feb 29', () => {
      // 2024 and 2020 are both leap years
      const result = subtractYears('2024-02-29', 4);
      expect(formatDateISO(result)).toBe('2020-02-29');
    });

    it('should throw error for invalid date', () => {
      expect(() => subtractYears('invalid', 1)).toThrow('Invalid date');
    });
  });

  describe('addYears', () => {
    it('should add years to a date', () => {
      const result = addYears(new Date(2026, 8, 3), 2);
      expect(formatDateISO(result)).toBe('2028-09-03');
    });

    it('should accept ISO string input', () => {
      const result = addYears('2026-09-03', 3);
      expect(formatDateISO(result)).toBe('2029-09-03');
    });

    it('should handle leap year Feb 29 when target year has no Feb 29', () => {
      // 2024 is a leap year, 2025 is not
      const result = addYears('2024-02-29', 1);
      expect(formatDateISO(result)).toBe('2025-02-28');
    });

    it('should handle leap year Feb 29 when target year also has Feb 29', () => {
      // 2024 and 2028 are both leap years
      const result = addYears('2024-02-29', 4);
      expect(formatDateISO(result)).toBe('2028-02-29');
    });

    it('should throw error for invalid date', () => {
      expect(() => addYears('invalid', 1)).toThrow('Invalid date');
    });
  });

  describe('getInvoiceDateRange', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return date range 1 year before to 2 years after today', () => {
      vi.setSystemTime(new Date(2026, 8, 3)); // Sept 3, 2026
      const range = getInvoiceDateRange();
      expect(range.minDate).toBe('2025-09-03');
      expect(range.maxDate).toBe('2028-09-03');
    });

    it('should accept a reference date', () => {
      const range = getInvoiceDateRange('2026-06-15');
      expect(range.minDate).toBe('2025-06-15');
      expect(range.maxDate).toBe('2028-06-15');
    });

    it('should have correct constants', () => {
      expect(DATE_RANGE_YEARS_BEFORE).toBe(1);
      expect(DATE_RANGE_YEARS_AFTER).toBe(2);
    });
  });

  describe('isValidInvoiceDate', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 8, 3)); // Sept 3, 2026
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return true for dates within valid range', () => {
      expect(isValidInvoiceDate('2026-06-15')).toBe(true);
      expect(isValidInvoiceDate('2027-01-01')).toBe(true);
    });

    it('should return true for dates at range boundaries', () => {
      expect(isValidInvoiceDate('2025-09-03')).toBe(true); // 1 year before
      expect(isValidInvoiceDate('2028-09-03')).toBe(true); // 2 years after
    });

    it('should return false for dates too far in the past', () => {
      expect(isValidInvoiceDate('2020-01-01')).toBe(false);
      expect(isValidInvoiceDate('2024-09-02')).toBe(false); // Just outside range
    });

    it('should return false for dates too far in the future', () => {
      expect(isValidInvoiceDate('2030-01-01')).toBe(false);
      expect(isValidInvoiceDate('2028-09-04')).toBe(false); // Just outside range
    });
  });

  describe('parseISODate', () => {
    it('should parse valid ISO date strings', () => {
      const date = parseISODate('2026-11-20');
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(10); // November (0-indexed)
      expect(date.getDate()).toBe(20);
    });

    it('should handle single digit month and day with padding', () => {
      const date = parseISODate('2026-01-05');
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(5);
    });

    it('should return invalid date for malformed strings', () => {
      expect(isValidDate(parseISODate('invalid'))).toBe(false);
      expect(isValidDate(parseISODate('2026-11'))).toBe(false);
      expect(isValidDate(parseISODate('2026/11/20'))).toBe(false);
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid dates', () => {
      expect(isValidDate(new Date())).toBe(true);
      expect(isValidDate(new Date(2026, 8, 3))).toBe(true);
    });

    it('should return false for invalid dates', () => {
      expect(isValidDate(new Date(NaN))).toBe(false);
      expect(isValidDate(new Date('invalid'))).toBe(false);
    });
  });

  describe('compareDates', () => {
    it('should return -1 when first date is earlier', () => {
      expect(compareDates('2026-09-03', '2026-09-18')).toBe(-1);
      expect(compareDates('2025-01-01', '2026-01-01')).toBe(-1);
    });

    it('should return 1 when first date is later', () => {
      expect(compareDates('2026-09-18', '2026-09-03')).toBe(1);
      expect(compareDates('2027-01-01', '2026-01-01')).toBe(1);
    });

    it('should return 0 when dates are equal', () => {
      expect(compareDates('2026-09-03', '2026-09-03')).toBe(0);
    });

    it('should accept Date objects', () => {
      expect(compareDates(new Date(2026, 8, 3), new Date(2026, 8, 18))).toBe(-1);
    });

    it('should ignore time components', () => {
      const date1 = new Date(2026, 8, 3, 10, 30);
      const date2 = new Date(2026, 8, 3, 15, 45);
      expect(compareDates(date1, date2)).toBe(0);
    });
  });

  describe('isToday', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 8, 3)); // Sept 3, 2026
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return true for today', () => {
      expect(isToday('2026-09-03')).toBe(true);
      expect(isToday(new Date(2026, 8, 3))).toBe(true);
    });

    it('should return false for other dates', () => {
      expect(isToday('2026-09-04')).toBe(false);
      expect(isToday('2026-09-02')).toBe(false);
    });
  });

  describe('isBefore', () => {
    it('should return true when first date is before second', () => {
      expect(isBefore('2026-09-03', '2026-09-18')).toBe(true);
    });

    it('should return false when first date is after or equal to second', () => {
      expect(isBefore('2026-09-18', '2026-09-03')).toBe(false);
      expect(isBefore('2026-09-03', '2026-09-03')).toBe(false);
    });
  });

  describe('isAfter', () => {
    it('should return true when first date is after second', () => {
      expect(isAfter('2026-09-18', '2026-09-03')).toBe(true);
    });

    it('should return false when first date is before or equal to second', () => {
      expect(isAfter('2026-09-03', '2026-09-18')).toBe(false);
      expect(isAfter('2026-09-03', '2026-09-03')).toBe(false);
    });
  });

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      expect(isSameDay('2026-09-03', '2026-09-03')).toBe(true);
    });

    it('should return false for different days', () => {
      expect(isSameDay('2026-09-03', '2026-09-04')).toBe(false);
    });

    it('should ignore time components', () => {
      const date1 = new Date(2026, 8, 3, 10, 30);
      const date2 = new Date(2026, 8, 3, 15, 45);
      expect(isSameDay(date1, date2)).toBe(true);
    });
  });

  describe('daysBetween', () => {
    it('should calculate positive days between dates', () => {
      expect(daysBetween('2026-09-03', '2026-09-18')).toBe(15);
      expect(daysBetween('2026-01-01', '2026-01-31')).toBe(30);
    });

    it('should calculate negative days when end is before start', () => {
      expect(daysBetween('2026-09-18', '2026-09-03')).toBe(-15);
    });

    it('should return 0 for same day', () => {
      expect(daysBetween('2026-09-03', '2026-09-03')).toBe(0);
    });

    it('should handle month and year boundaries', () => {
      expect(daysBetween('2026-02-27', '2026-03-02')).toBe(3);
      expect(daysBetween('2026-12-30', '2027-01-04')).toBe(5);
    });

    it('should accept Date objects', () => {
      expect(daysBetween(new Date(2026, 8, 3), new Date(2026, 8, 18))).toBe(15);
    });
  });
});
