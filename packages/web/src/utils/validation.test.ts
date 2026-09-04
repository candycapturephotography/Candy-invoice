/**
 * CandyCapture Photography Invoice Application
 * Validation Utilities Tests
 *
 * @description Unit tests for validation functions
 */

import { describe, it, expect } from 'vitest';
import {
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

describe('validateMobileNumber', () => {
  it('should accept valid 10-digit mobile number', () => {
    expect(validateMobileNumber('9500440272')).toEqual({ valid: true });
  });

  it('should accept mobile number with leading whitespace', () => {
    expect(validateMobileNumber('  9500440272  ')).toEqual({ valid: true });
  });

  it('should reject empty mobile number', () => {
    const result = validateMobileNumber('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Mobile number is required');
  });

  it('should reject mobile number with less than 10 digits', () => {
    const result = validateMobileNumber('950044027');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Mobile number must be exactly 10 digits');
  });

  it('should reject mobile number with more than 10 digits', () => {
    const result = validateMobileNumber('95004402721');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Mobile number must be exactly 10 digits');
  });

  it('should reject mobile number with non-digit characters', () => {
    const result = validateMobileNumber('950044027a');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Mobile number must contain only digits');
  });

  it('should reject mobile number with special characters', () => {
    const result = validateMobileNumber('9500-44027');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Mobile number must contain only digits');
  });

  it('should reject mobile number with spaces between digits', () => {
    const result = validateMobileNumber('9500 440272');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Mobile number must contain only digits');
  });
});

describe('validateEmail', () => {
  it('should accept valid email', () => {
    expect(validateEmail('test@example.com')).toEqual({ valid: true });
  });

  it('should accept empty email (optional field)', () => {
    expect(validateEmail('')).toEqual({ valid: true });
  });

  it('should accept email with subdomain', () => {
    expect(validateEmail('test@mail.example.com')).toEqual({ valid: true });
  });

  it('should accept email with plus sign in local part', () => {
    expect(validateEmail('test+tag@example.com')).toEqual({ valid: true });
  });

  it('should reject email without @ symbol', () => {
    const result = validateEmail('testexample.com');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Email must contain @ symbol');
  });

  it('should reject email with multiple @ symbols', () => {
    const result = validateEmail('test@@example.com');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Email must contain exactly one @ symbol');
  });

  it('should reject email without domain dot', () => {
    const result = validateEmail('test@example');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Email domain must contain at least one dot');
  });

  it('should reject email with domain starting with dot', () => {
    const result = validateEmail('test@.example.com');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Email domain cannot start or end with a dot');
  });

  it('should reject email with domain ending with dot', () => {
    const result = validateEmail('test@example.com.');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Email domain cannot start or end with a dot');
  });

  it('should reject email with empty local part', () => {
    const result = validateEmail('@example.com');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Email username cannot be empty');
  });

  it('should reject email with empty domain', () => {
    const result = validateEmail('test@');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Email domain cannot be empty');
  });

  it('should reject email exceeding 254 characters', () => {
    const longEmail = 'a'.repeat(250) + '@example.com';
    const result = validateEmail(longEmail);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Email must not exceed 254 characters');
  });
});

describe('validateRequiredEmail', () => {
  it('should accept valid email', () => {
    expect(validateRequiredEmail('test@example.com')).toEqual({ valid: true });
  });

  it('should reject empty email', () => {
    const result = validateRequiredEmail('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Email is required');
  });
});

describe('validateAmount', () => {
  it('should accept valid amount', () => {
    expect(validateAmount(120000.00)).toEqual({ valid: true });
  });

  it('should accept minimum valid amount', () => {
    expect(validateAmount(0.01)).toEqual({ valid: true });
  });

  it('should accept maximum valid amount', () => {
    expect(validateAmount(99999999.99)).toEqual({ valid: true });
  });

  it('should accept amount as string', () => {
    expect(validateAmount('120000.50')).toEqual({ valid: true });
  });

  it('should reject amount less than 0.01', () => {
    const result = validateAmount(0.001);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Amount must be at least ₹0.01');
  });

  it('should reject zero amount', () => {
    const result = validateAmount(0);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Amount must be at least ₹0.01');
  });

  it('should reject amount exceeding maximum', () => {
    const result = validateAmount(100000000);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Amount cannot exceed ₹99,999,999.99');
  });

  it('should reject amount with more than 2 decimal places', () => {
    const result = validateAmount(100.123);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Amount cannot have more than 2 decimal places');
  });

  it('should reject invalid number string', () => {
    const result = validateAmount('abc');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Amount must be a valid number');
  });

  it('should reject negative amount', () => {
    const result = validateAmount(-100);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Amount must be at least ₹0.01');
  });
});

describe('validateAdvancePayment', () => {
  it('should accept valid advance payment', () => {
    expect(validateAdvancePayment(20000, 120000)).toEqual({ valid: true });
  });

  it('should accept zero advance payment', () => {
    expect(validateAdvancePayment(0, 120000)).toEqual({ valid: true });
  });

  it('should accept advance equal to total (fully paid)', () => {
    expect(validateAdvancePayment(120000, 120000)).toEqual({ valid: true });
  });

  it('should reject advance exceeding total amount', () => {
    const result = validateAdvancePayment(150000, 120000);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Advance paid cannot exceed total amount');
  });

  it('should reject negative advance payment', () => {
    const result = validateAdvancePayment(-1000, 120000);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Advance paid cannot be negative');
  });

  it('should reject advance with more than 2 decimal places', () => {
    const result = validateAdvancePayment(100.123, 120000);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Advance paid cannot have more than 2 decimal places');
  });

  it('should accept string inputs', () => {
    expect(validateAdvancePayment('20000.50', '120000')).toEqual({ valid: true });
  });
});

describe('validateIFSCCode', () => {
  it('should accept valid IFSC code', () => {
    expect(validateIFSCCode('ICIC0001234')).toEqual({ valid: true });
  });

  it('should accept valid IFSC code with lowercase (auto-converts)', () => {
    expect(validateIFSCCode('icic0001234')).toEqual({ valid: true });
  });

  it('should accept empty IFSC code (optional field)', () => {
    expect(validateIFSCCode('')).toEqual({ valid: true });
  });

  it('should accept IFSC code with alphanumeric last 6 characters', () => {
    expect(validateIFSCCode('SBIN0ABC123')).toEqual({ valid: true });
  });

  it('should reject IFSC code with wrong length', () => {
    const result = validateIFSCCode('ICIC000123');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('IFSC code must be exactly 11 characters');
  });

  it('should reject IFSC code without 0 in 5th position', () => {
    const result = validateIFSCCode('ICIC1001234');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('IFSC code must be 4 letters followed by 0');
  });

  it('should reject IFSC code with numbers in first 4 characters', () => {
    const result = validateIFSCCode('1CIC0001234');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('IFSC code must be 4 letters followed by 0');
  });

  it('should reject IFSC code with special characters', () => {
    const result = validateIFSCCode('ICIC0001-34');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('IFSC code must be 4 letters followed by 0');
  });
});

describe('validateRequiredIFSCCode', () => {
  it('should accept valid IFSC code', () => {
    expect(validateRequiredIFSCCode('ICIC0001234')).toEqual({ valid: true });
  });

  it('should reject empty IFSC code', () => {
    const result = validateRequiredIFSCCode('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('IFSC code is required');
  });
});

describe('validateUPIId', () => {
  it('should accept valid UPI ID', () => {
    expect(validateUPIId('candycapture@upi')).toEqual({ valid: true });
  });

  it('should accept UPI ID with numbers', () => {
    expect(validateUPIId('candy123@paytm')).toEqual({ valid: true });
  });

  it('should accept UPI ID with dots', () => {
    expect(validateUPIId('candy.capture@upi')).toEqual({ valid: true });
  });

  it('should accept empty UPI ID (optional field)', () => {
    expect(validateUPIId('')).toEqual({ valid: true });
  });

  it('should reject UPI ID without @ symbol', () => {
    const result = validateUPIId('candycaptureupi');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('username@provider');
  });

  it('should reject UPI ID with empty username', () => {
    const result = validateUPIId('@upi');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('username@provider');
  });

  it('should reject UPI ID exceeding 50 characters', () => {
    const longUPI = 'a'.repeat(47) + '@upi'; // 51 characters total
    const result = validateUPIId(longUPI);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('UPI ID must not exceed 50 characters');
  });
});

describe('validateInvoicePrefix', () => {
  it('should accept valid prefix with letters and hyphen', () => {
    expect(validateInvoicePrefix('CC-')).toEqual({ valid: true });
  });

  it('should accept prefix with only letters', () => {
    expect(validateInvoicePrefix('INV')).toEqual({ valid: true });
  });

  it('should accept prefix with numbers', () => {
    expect(validateInvoicePrefix('INV2024')).toEqual({ valid: true });
  });

  it('should accept single character prefix', () => {
    expect(validateInvoicePrefix('A')).toEqual({ valid: true });
  });

  it('should accept 10 character prefix', () => {
    expect(validateInvoicePrefix('ABCD-12345')).toEqual({ valid: true });
  });

  it('should reject empty prefix', () => {
    const result = validateInvoicePrefix('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invoice prefix is required');
  });

  it('should reject prefix exceeding 10 characters', () => {
    const result = validateInvoicePrefix('CANDYCAPTUR');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invoice prefix must not exceed 10 characters');
  });

  it('should reject prefix with special characters', () => {
    const result = validateInvoicePrefix('CC@#');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invoice prefix can only contain letters, numbers, and hyphens');
  });

  it('should reject prefix with spaces', () => {
    const result = validateInvoicePrefix('CC IN');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invoice prefix can only contain letters, numbers, and hyphens');
  });
});

describe('validateBankAccountNumber', () => {
  it('should accept valid 12-digit account number', () => {
    expect(validateBankAccountNumber('123456789012')).toEqual({ valid: true });
  });

  it('should accept minimum 9-digit account number', () => {
    expect(validateBankAccountNumber('123456789')).toEqual({ valid: true });
  });

  it('should accept maximum 18-digit account number', () => {
    expect(validateBankAccountNumber('123456789012345678')).toEqual({ valid: true });
  });

  it('should accept account number with spaces (cleans them)', () => {
    expect(validateBankAccountNumber('1234 5678 9012')).toEqual({ valid: true });
  });

  it('should accept empty account number (optional field)', () => {
    expect(validateBankAccountNumber('')).toEqual({ valid: true });
  });

  it('should reject account number with less than 9 digits', () => {
    const result = validateBankAccountNumber('12345678');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Account number must be at least 9 digits');
  });

  it('should reject account number exceeding 18 digits', () => {
    const result = validateBankAccountNumber('1234567890123456789');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Account number must not exceed 18 digits');
  });

  it('should reject account number with letters', () => {
    const result = validateBankAccountNumber('12345678901A');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Account number must contain only digits');
  });
});

describe('validateInstagramHandle', () => {
  it('should accept valid handle', () => {
    expect(validateInstagramHandle('candycapture_photo')).toEqual({ valid: true });
  });

  it('should accept handle with @ prefix (strips it)', () => {
    expect(validateInstagramHandle('@candycapture')).toEqual({ valid: true });
  });

  it('should accept handle with numbers', () => {
    expect(validateInstagramHandle('candycapture123')).toEqual({ valid: true });
  });

  it('should accept empty handle (optional field)', () => {
    expect(validateInstagramHandle('')).toEqual({ valid: true });
  });

  it('should reject handle exceeding 30 characters', () => {
    const longHandle = 'a'.repeat(31);
    const result = validateInstagramHandle(longHandle);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Instagram handle must not exceed 30 characters');
  });

  it('should reject handle with special characters', () => {
    const result = validateInstagramHandle('candy@capture');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Instagram handle can only contain letters, numbers, and underscores');
  });

  it('should reject handle with dots', () => {
    const result = validateInstagramHandle('candy.capture');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Instagram handle can only contain letters, numbers, and underscores');
  });
});

describe('validateServiceQuantity', () => {
  it('should accept valid quantity', () => {
    expect(validateServiceQuantity(1)).toEqual({ valid: true });
  });

  it('should accept maximum quantity', () => {
    expect(validateServiceQuantity(9999)).toEqual({ valid: true });
  });

  it('should accept quantity as string', () => {
    expect(validateServiceQuantity('5')).toEqual({ valid: true });
  });

  it('should reject zero quantity', () => {
    const result = validateServiceQuantity(0);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Quantity must be at least 1');
  });

  it('should reject negative quantity', () => {
    const result = validateServiceQuantity(-1);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Quantity must be at least 1');
  });

  it('should reject quantity exceeding 9999', () => {
    const result = validateServiceQuantity(10000);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Quantity cannot exceed 9999');
  });

  it('should reject decimal quantity', () => {
    const result = validateServiceQuantity(2.5);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Quantity must be a whole number');
  });

  it('should reject invalid string', () => {
    const result = validateServiceQuantity('abc');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Quantity must be a valid number');
  });
});

describe('validateDefaultQuantity', () => {
  it('should accept valid default quantity', () => {
    expect(validateDefaultQuantity(1)).toEqual({ valid: true });
  });

  it('should accept maximum default quantity', () => {
    expect(validateDefaultQuantity(999)).toEqual({ valid: true });
  });

  it('should reject default quantity exceeding 999', () => {
    const result = validateDefaultQuantity(1000);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Default quantity cannot exceed 999');
  });

  it('should reject zero default quantity', () => {
    const result = validateDefaultQuantity(0);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Default quantity must be at least 1');
  });

  it('should reject decimal default quantity', () => {
    const result = validateDefaultQuantity(1.5);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Default quantity must be a whole number');
  });
});
