/**
 * Utility functions for CandyCapture Invoice Application
 *
 * @module utils
 */

// Currency utilities
export { formatIndianCurrency, parseIndianCurrency } from './currency';

// Date utilities
export {
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

// Payment utilities
export {
  calculateBalanceDue,
  calculatePaymentStatus,
  calculatePaymentDetails,
} from './payment';

// Validation utilities
export {
  type ValidationResult,
  validateMobileNumber,
  validateEmail,
  validateRequiredEmail,
  validateAmount,
  validateAdvancePayment,
  validateIFSCCode,
  validateRequiredIFSCCode,
  validateUPIId,
  validateInvoicePrefix,
  validateBankAccountNumber,
  validateInstagramHandle,
  validateServiceQuantity,
  validateDefaultQuantity,
} from './validation';
