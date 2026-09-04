/**
 * Date formatting and calculation utilities for CandyCapture Invoice Application
 * 
 * Supports Indian date format (DD-Mon-YYYY) for display and ISO format (YYYY-MM-DD) for storage.
 * All functions handle edge cases and maintain consistency across the application.
 * 
 * @module utils/date
 */

/**
 * Month abbreviations for Indian date format
 */
const MONTH_ABBREVIATIONS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/**
 * Default due date offset in days from invoice date
 * Requirements: 8.4, 12.8 - default 15 days offset
 */
export const DEFAULT_DUE_DATE_OFFSET_DAYS = 15;

/**
 * Date range limits for invoice dates
 * Requirements: 8.5 - 1 year before to 2 years after current date
 */
export const DATE_RANGE_YEARS_BEFORE = 1;
export const DATE_RANGE_YEARS_AFTER = 2;

/**
 * Formats an ISO date string to Indian date format (DD-Mon-YYYY)
 * 
 * @param isoDate - Date in ISO format (YYYY-MM-DD) or Date object
 * @returns Formatted date string in "DD-Mon-YYYY" format (e.g., "20-Nov-2026")
 * @throws Error if the date is invalid
 * 
 * @example
 * formatDate('2026-11-20') // Returns "20-Nov-2026"
 * formatDate('2026-09-03') // Returns "03-Sep-2026"
 * formatDate(new Date(2026, 10, 20)) // Returns "20-Nov-2026"
 */
export function formatDate(isoDate: string | Date): string {
  const date = typeof isoDate === 'string' ? parseISODate(isoDate) : isoDate;
  
  if (!isValidDate(date)) {
    throw new Error(`Invalid date: ${isoDate}`);
  }
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTH_ABBREVIATIONS[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
}

/**
 * Formats a Date object to ISO date string (YYYY-MM-DD)
 * 
 * @param date - Date object to format
 * @returns Date string in ISO format (YYYY-MM-DD)
 * @throws Error if the date is invalid
 * 
 * @example
 * formatDateISO(new Date(2026, 10, 20)) // Returns "2026-11-20"
 * formatDateISO(new Date(2026, 8, 3)) // Returns "2026-09-03"
 */
export function formatDateISO(date: Date): string {
  if (!isValidDate(date)) {
    throw new Error('Invalid date provided');
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the due date by adding a specified number of days to a date
 * 
 * Requirements: 8.4, 12.8 - Default 15 days offset from invoice date
 * 
 * @param invoiceDate - Invoice date in ISO format (YYYY-MM-DD) or Date object
 * @param daysOffset - Number of days to add (default: 15)
 * @returns Due date in ISO format (YYYY-MM-DD)
 * @throws Error if the invoice date is invalid
 * 
 * @example
 * calculateDueDate('2026-09-03', 15) // Returns "2026-09-18"
 * calculateDueDate('2026-11-20', 30) // Returns "2026-12-20"
 * calculateDueDate('2026-02-27', 3) // Returns "2026-03-02" (handles month boundaries)
 */
export function calculateDueDate(
  invoiceDate: string | Date,
  daysOffset: number = DEFAULT_DUE_DATE_OFFSET_DAYS
): string {
  const date = typeof invoiceDate === 'string' ? parseISODate(invoiceDate) : new Date(invoiceDate);
  
  if (!isValidDate(date)) {
    throw new Error(`Invalid invoice date: ${invoiceDate}`);
  }
  
  const dueDate = addDays(date, daysOffset);
  return formatDateISO(dueDate);
}

/**
 * Returns today's date in ISO format (YYYY-MM-DD)
 * 
 * Requirements: 8.3 - Invoice Date defaults to current date
 * 
 * @returns Today's date in ISO format
 * 
 * @example
 * getTodayISO() // Returns e.g., "2026-09-03" (current date)
 */
export function getTodayISO(): string {
  return formatDateISO(new Date());
}

/**
 * Checks if a date falls within a specified date range (inclusive)
 * 
 * Requirements: 8.5 - Date range validation for invoice dates
 * 
 * @param date - Date to validate (ISO string or Date object)
 * @param minDate - Minimum allowed date (ISO string or Date object)
 * @param maxDate - Maximum allowed date (ISO string or Date object)
 * @returns True if date is within range (inclusive), false otherwise
 * 
 * @example
 * isDateInRange('2026-06-15', '2026-01-01', '2026-12-31') // Returns true
 * isDateInRange('2025-01-01', '2026-01-01', '2026-12-31') // Returns false
 */
export function isDateInRange(
  date: string | Date,
  minDate: string | Date,
  maxDate: string | Date
): boolean {
  const dateToCheck = typeof date === 'string' ? parseISODate(date) : date;
  const min = typeof minDate === 'string' ? parseISODate(minDate) : minDate;
  const max = typeof maxDate === 'string' ? parseISODate(maxDate) : maxDate;
  
  if (!isValidDate(dateToCheck) || !isValidDate(min) || !isValidDate(max)) {
    return false;
  }
  
  // Normalize to start of day for comparison
  const dateNormalized = normalizeToStartOfDay(dateToCheck);
  const minNormalized = normalizeToStartOfDay(min);
  const maxNormalized = normalizeToStartOfDay(max);
  
  return dateNormalized >= minNormalized && dateNormalized <= maxNormalized;
}

/**
 * Adds a specified number of days to a date
 * 
 * @param date - Base date (Date object or ISO string)
 * @param days - Number of days to add (can be negative)
 * @returns New Date object with days added
 * @throws Error if the date is invalid
 * 
 * @example
 * addDays(new Date(2026, 8, 3), 15) // Returns Date for 2026-09-18
 * addDays('2026-09-03', 15) // Returns Date for 2026-09-18
 * addDays('2026-02-27', 3) // Returns Date for 2026-03-02 (handles month boundaries)
 */
export function addDays(date: Date | string, days: number): Date {
  const baseDate = typeof date === 'string' ? parseISODate(date) : new Date(date);
  
  if (!isValidDate(baseDate)) {
    throw new Error(`Invalid date: ${date}`);
  }
  
  const result = new Date(baseDate);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Subtracts a specified number of years from a date
 * 
 * Requirements: 8.5 - Used for calculating date range limits (1 year before)
 * 
 * @param date - Base date (Date object or ISO string)
 * @param years - Number of years to subtract
 * @returns New Date object with years subtracted
 * @throws Error if the date is invalid
 * 
 * @example
 * subtractYears(new Date(2026, 8, 3), 1) // Returns Date for 2025-09-03
 * subtractYears('2026-09-03', 2) // Returns Date for 2024-09-03
 */
export function subtractYears(date: Date | string, years: number): Date {
  const baseDate = typeof date === 'string' ? parseISODate(date) : new Date(date);
  
  if (!isValidDate(baseDate)) {
    throw new Error(`Invalid date: ${date}`);
  }
  
  const result = new Date(baseDate);
  result.setFullYear(result.getFullYear() - years);
  
  // Handle Feb 29 edge case: if original date was Feb 29 and target year doesn't have Feb 29,
  // JavaScript will roll over to March 1. Adjust to Feb 28 in this case.
  if (
    baseDate.getMonth() !== result.getMonth() &&
    baseDate.getMonth() === 1 &&
    baseDate.getDate() === 29
  ) {
    result.setDate(28);
    result.setMonth(1);
  }
  
  return result;
}

/**
 * Adds a specified number of years to a date
 * 
 * Requirements: 8.5 - Used for calculating date range limits (2 years after)
 * 
 * @param date - Base date (Date object or ISO string)
 * @param years - Number of years to add
 * @returns New Date object with years added
 * @throws Error if the date is invalid
 * 
 * @example
 * addYears(new Date(2026, 8, 3), 2) // Returns Date for 2028-09-03
 * addYears('2024-02-29', 1) // Returns Date for 2025-02-28 (leap year handling)
 */
export function addYears(date: Date | string, years: number): Date {
  const baseDate = typeof date === 'string' ? parseISODate(date) : new Date(date);
  
  if (!isValidDate(baseDate)) {
    throw new Error(`Invalid date: ${date}`);
  }
  
  const result = new Date(baseDate);
  result.setFullYear(result.getFullYear() + years);
  
  // Handle Feb 29 edge case
  if (
    baseDate.getMonth() !== result.getMonth() &&
    baseDate.getMonth() === 1 &&
    baseDate.getDate() === 29
  ) {
    result.setDate(28);
    result.setMonth(1);
  }
  
  return result;
}

/**
 * Gets the valid date range for invoice dates based on current date
 * 
 * Requirements: 8.5 - 1 year before to 2 years after current date
 * 
 * @param referenceDate - Reference date for calculating range (defaults to today)
 * @returns Object with minDate and maxDate in ISO format
 * 
 * @example
 * getInvoiceDateRange() // If today is 2026-09-03, returns { minDate: '2025-09-03', maxDate: '2028-09-03' }
 */
export function getInvoiceDateRange(referenceDate?: Date | string): {
  minDate: string;
  maxDate: string;
} {
  const today = referenceDate
    ? (typeof referenceDate === 'string' ? parseISODate(referenceDate) : referenceDate)
    : new Date();
  
  const minDate = subtractYears(today, DATE_RANGE_YEARS_BEFORE);
  const maxDate = addYears(today, DATE_RANGE_YEARS_AFTER);
  
  return {
    minDate: formatDateISO(minDate),
    maxDate: formatDateISO(maxDate),
  };
}

/**
 * Validates if an invoice date is within the allowed range
 * 
 * Requirements: 8.5 - Validates dates within 1 year before to 2 years after current date
 * 
 * @param invoiceDate - Date to validate (ISO string or Date object)
 * @param referenceDate - Reference date for range calculation (defaults to today)
 * @returns True if date is valid for use as invoice date
 * 
 * @example
 * isValidInvoiceDate('2026-06-15') // Returns true if current date is around 2026
 * isValidInvoiceDate('2020-01-01') // Returns false (too far in the past)
 */
export function isValidInvoiceDate(
  invoiceDate: string | Date,
  referenceDate?: Date | string
): boolean {
  const { minDate, maxDate } = getInvoiceDateRange(referenceDate);
  return isDateInRange(invoiceDate, minDate, maxDate);
}

/**
 * Parses an ISO date string to a Date object
 * Handles the date string in YYYY-MM-DD format correctly without timezone issues
 * 
 * @param isoString - Date string in ISO format (YYYY-MM-DD)
 * @returns Date object representing the date at midnight local time
 * 
 * @example
 * parseISODate('2026-11-20') // Returns Date object for Nov 20, 2026
 */
export function parseISODate(isoString: string): Date {
  // Parse YYYY-MM-DD format manually to avoid timezone issues
  const parts = isoString.split('-');
  
  if (parts.length !== 3 || parts[0] === undefined || parts[1] === undefined || parts[2] === undefined) {
    return new Date(NaN);
  }
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
  const day = parseInt(parts[2], 10);
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return new Date(NaN);
  }
  
  // Validate month range (0-11 after adjustment)
  if (month < 0 || month > 11) {
    return new Date(NaN);
  }
  
  // Validate day range (1-31, further validation happens via Date constructor)
  if (day < 1 || day > 31) {
    return new Date(NaN);
  }
  
  return new Date(year, month, day);
}

/**
 * Checks if a Date object represents a valid date
 * 
 * @param date - Date object to validate
 * @returns True if the date is valid, false otherwise
 */
export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Normalizes a date to the start of the day (midnight local time)
 * Useful for date comparisons that should ignore time components
 * 
 * @param date - Date to normalize
 * @returns New Date object set to midnight of the same day
 */
function normalizeToStartOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Compares two dates ignoring time components
 * 
 * @param date1 - First date (ISO string or Date object)
 * @param date2 - Second date (ISO string or Date object)
 * @returns -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 * 
 * @example
 * compareDates('2026-09-03', '2026-09-18') // Returns -1
 * compareDates('2026-09-18', '2026-09-03') // Returns 1
 * compareDates('2026-09-03', '2026-09-03') // Returns 0
 */
export function compareDates(date1: string | Date, date2: string | Date): -1 | 0 | 1 {
  const d1 = typeof date1 === 'string' ? parseISODate(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISODate(date2) : date2;
  
  const d1Normalized = normalizeToStartOfDay(d1);
  const d2Normalized = normalizeToStartOfDay(d2);
  
  const time1 = d1Normalized.getTime();
  const time2 = d2Normalized.getTime();
  
  if (time1 < time2) return -1;
  if (time1 > time2) return 1;
  return 0;
}

/**
 * Checks if a date is today
 * 
 * @param date - Date to check (ISO string or Date object)
 * @returns True if the date is today
 * 
 * @example
 * isToday(getTodayISO()) // Returns true
 * isToday('2020-01-01') // Returns false (unless today is Jan 1, 2020)
 */
export function isToday(date: string | Date): boolean {
  return compareDates(date, new Date()) === 0;
}

/**
 * Checks if date1 is before date2
 * 
 * @param date1 - First date (ISO string or Date object)
 * @param date2 - Second date (ISO string or Date object)
 * @returns True if date1 is before date2
 */
export function isBefore(date1: string | Date, date2: string | Date): boolean {
  return compareDates(date1, date2) === -1;
}

/**
 * Checks if date1 is after date2
 * 
 * @param date1 - First date (ISO string or Date object)
 * @param date2 - Second date (ISO string or Date object)
 * @returns True if date1 is after date2
 */
export function isAfter(date1: string | Date, date2: string | Date): boolean {
  return compareDates(date1, date2) === 1;
}

/**
 * Checks if date1 is the same day as date2
 * 
 * @param date1 - First date (ISO string or Date object)
 * @param date2 - Second date (ISO string or Date object)
 * @returns True if both dates are the same day
 */
export function isSameDay(date1: string | Date, date2: string | Date): boolean {
  return compareDates(date1, date2) === 0;
}

/**
 * Calculates the number of days between two dates
 * 
 * @param startDate - Start date (ISO string or Date object)
 * @param endDate - End date (ISO string or Date object)
 * @returns Number of days between the dates (positive if endDate > startDate)
 * 
 * @example
 * daysBetween('2026-09-03', '2026-09-18') // Returns 15
 * daysBetween('2026-09-18', '2026-09-03') // Returns -15
 */
export function daysBetween(startDate: string | Date, endDate: string | Date): number {
  const start = typeof startDate === 'string' ? parseISODate(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISODate(endDate) : endDate;
  
  const startNormalized = normalizeToStartOfDay(start);
  const endNormalized = normalizeToStartOfDay(end);
  
  const diffMs = endNormalized.getTime() - startNormalized.getTime();
  const msPerDay = 24 * 60 * 60 * 1000;
  
  return Math.round(diffMs / msPerDay);
}
