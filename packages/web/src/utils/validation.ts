/**
 * CandyCapture Photography Invoice Application
 * Validation Utilities
 *
 * @description Validation functions for user input fields
 * @requirements 5.2, 5.3, 7.6, 12.4
 */

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates an Indian mobile number
 *
 * @description Mobile number must be exactly 10 digits
 * @requirements 5.2 - Mobile number must be 10 digits
 *
 * @param mobile - The mobile number to validate
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateMobileNumber(mobile: string): ValidationResult {
  if (!mobile || mobile.trim() === '') {
    return { valid: false, error: 'Mobile number is required' };
  }

  const trimmedMobile = mobile.trim();

  // Check if contains only digits
  if (!/^\d+$/.test(trimmedMobile)) {
    return { valid: false, error: 'Mobile number must contain only digits' };
  }

  // Check exact length of 10 digits
  if (trimmedMobile.length !== 10) {
    return { valid: false, error: 'Mobile number must be exactly 10 digits' };
  }

  return { valid: true };
}

/**
 * Validates an email address
 *
 * @description Email must contain exactly one @ symbol followed by a valid domain
 * with at least one dot
 * @requirements 5.3 - Email must have @ and valid domain with at least one dot
 *
 * @param email - The email address to validate
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateEmail(email: string): ValidationResult {
  // Email is optional, so empty is valid
  if (!email || email.trim() === '') {
    return { valid: true };
  }

  const trimmedEmail = email.trim();

  // Check max length (254 characters per requirements)
  if (trimmedEmail.length > 254) {
    return { valid: false, error: 'Email must not exceed 254 characters' };
  }

  // Count @ symbols - must be exactly one
  const atCount = (trimmedEmail.match(/@/g) || []).length;
  if (atCount === 0) {
    return { valid: false, error: 'Email must contain @ symbol' };
  }
  if (atCount > 1) {
    return { valid: false, error: 'Email must contain exactly one @ symbol' };
  }

  // Split by @ to validate local and domain parts
  const atIndex = trimmedEmail.indexOf('@');
  const localPart = trimmedEmail.substring(0, atIndex);
  const domainPart = trimmedEmail.substring(atIndex + 1);

  // Local part validation
  if (localPart.length === 0) {
    return { valid: false, error: 'Email username cannot be empty' };
  }

  // Domain part validation
  if (domainPart.length === 0) {
    return { valid: false, error: 'Email domain cannot be empty' };
  }

  // Domain must contain at least one dot
  if (!domainPart.includes('.')) {
    return { valid: false, error: 'Email domain must contain at least one dot' };
  }

  // Domain cannot start or end with a dot
  if (domainPart.startsWith('.') || domainPart.endsWith('.')) {
    return { valid: false, error: 'Email domain cannot start or end with a dot' };
  }

  // Domain parts separated by dot must not be empty
  const domainParts = domainPart.split('.');
  if (domainParts.some((part) => part.length === 0)) {
    return { valid: false, error: 'Invalid email domain format' };
  }

  return { valid: true };
}

/**
 * Validates a required email address (used for settings)
 *
 * @description Same as validateEmail but email is required
 * @requirements 12.1 - Email is required for business settings
 *
 * @param email - The email address to validate
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateRequiredEmail(email: string): ValidationResult {
  if (!email || email.trim() === '') {
    return { valid: false, error: 'Email is required' };
  }

  return validateEmail(email);
}

/**
 * Validates a monetary amount
 *
 * @description Amount must be between 0.01 and 99,999,999.99 with max 2 decimal places
 * @requirements 7.6 - Total Amount values from ₹0.01 to ₹99,999,999.99 with 2 decimal precision
 *
 * @param amount - The amount to validate (as number or string)
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateAmount(amount: number | string): ValidationResult {
  // Convert string to number if needed
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Check if it's a valid number
  if (isNaN(numAmount)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }

  // Check minimum value
  if (numAmount < 0.01) {
    return { valid: false, error: 'Amount must be at least ₹0.01' };
  }

  // Check maximum value
  if (numAmount > 99999999.99) {
    return { valid: false, error: 'Amount cannot exceed ₹99,999,999.99' };
  }

  // Check decimal places (max 2)
  const amountStr = numAmount.toString();
  if (amountStr.includes('.')) {
    const decimalPart = amountStr.split('.')[1];
    if (decimalPart && decimalPart.length > 2) {
      return { valid: false, error: 'Amount cannot have more than 2 decimal places' };
    }
  }

  return { valid: true };
}

/**
 * Validates an advance payment amount against total amount
 *
 * @description Advance paid must be between 0 and total amount
 * @requirements 7.7, 7.8 - Advance Paid values from ₹0.00 to Total Amount
 *
 * @param advancePaid - The advance payment amount
 * @param totalAmount - The total invoice amount
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateAdvancePayment(
  advancePaid: number | string,
  totalAmount: number | string
): ValidationResult {
  const numAdvance = typeof advancePaid === 'string' ? parseFloat(advancePaid) : advancePaid;
  const numTotal = typeof totalAmount === 'string' ? parseFloat(totalAmount) : totalAmount;

  // Check if advance is a valid number
  if (isNaN(numAdvance)) {
    return { valid: false, error: 'Advance paid must be a valid number' };
  }

  // Advance can be zero
  if (numAdvance < 0) {
    return { valid: false, error: 'Advance paid cannot be negative' };
  }

  // Check decimal places (max 2)
  const advanceStr = numAdvance.toString();
  if (advanceStr.includes('.')) {
    const decimalPart = advanceStr.split('.')[1];
    if (decimalPart && decimalPart.length > 2) {
      return { valid: false, error: 'Advance paid cannot have more than 2 decimal places' };
    }
  }

  // Check against total amount if total is valid
  if (!isNaN(numTotal) && numAdvance > numTotal) {
    return { valid: false, error: 'Advance paid cannot exceed total amount' };
  }

  return { valid: true };
}

/**
 * Validates an IFSC code
 *
 * @description IFSC code must match pattern: 4 letters + 0 + 6 alphanumeric characters
 * @requirements 12.4 - IFSC Code (11 alphanumeric characters matching pattern: 4 letters followed by 0 followed by 6 alphanumeric characters)
 *
 * @param ifscCode - The IFSC code to validate
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateIFSCCode(ifscCode: string): ValidationResult {
  // IFSC is optional, so empty is valid
  if (!ifscCode || ifscCode.trim() === '') {
    return { valid: true };
  }

  const trimmedCode = ifscCode.trim().toUpperCase();

  // Check exact length of 11 characters
  if (trimmedCode.length !== 11) {
    return { valid: false, error: 'IFSC code must be exactly 11 characters' };
  }

  // Pattern: 4 letters + 0 + 6 alphanumeric
  // Example: ICIC0001234, SBIN0012345
  const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;

  if (!ifscPattern.test(trimmedCode)) {
    return {
      valid: false,
      error: 'IFSC code must be 4 letters followed by 0 and 6 alphanumeric characters (e.g., ICIC0001234)',
    };
  }

  return { valid: true };
}

/**
 * Validates a required IFSC code (used when bank details are being validated)
 *
 * @description Same as validateIFSCCode but IFSC is required
 *
 * @param ifscCode - The IFSC code to validate
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateRequiredIFSCCode(ifscCode: string): ValidationResult {
  if (!ifscCode || ifscCode.trim() === '') {
    return { valid: false, error: 'IFSC code is required' };
  }

  return validateIFSCCode(ifscCode);
}

/**
 * Validates a UPI ID
 *
 * @description UPI ID must follow username@provider format
 * @requirements 12.4 - UPI ID (valid UPI format: username@provider, maximum 50 characters)
 *
 * @param upiId - The UPI ID to validate
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateUPIId(upiId: string): ValidationResult {
  // UPI ID is optional, so empty is valid
  if (!upiId || upiId.trim() === '') {
    return { valid: true };
  }

  const trimmedUPI = upiId.trim().toLowerCase();

  // Check max length (50 characters)
  if (trimmedUPI.length > 50) {
    return { valid: false, error: 'UPI ID must not exceed 50 characters' };
  }

  // UPI pattern: username@provider
  // Username: alphanumeric with dots and hyphens allowed
  // Provider: alphanumeric (bank or payment provider VPA handle)
  const upiPattern = /^[a-z0-9][a-z0-9.\-_]*@[a-z0-9]+$/;

  if (!upiPattern.test(trimmedUPI)) {
    return {
      valid: false,
      error: 'UPI ID must be in format username@provider (e.g., candycapture@upi)',
    };
  }

  // Additional check: username part cannot be empty
  const atIndex = trimmedUPI.indexOf('@');
  const usernamePart = trimmedUPI.substring(0, atIndex);
  const providerPart = trimmedUPI.substring(atIndex + 1);

  if (usernamePart.length === 0) {
    return { valid: false, error: 'UPI username cannot be empty' };
  }

  if (providerPart.length === 0) {
    return { valid: false, error: 'UPI provider cannot be empty' };
  }

  return { valid: true };
}

/**
 * Validates an invoice prefix
 *
 * @description Invoice prefix must be 1-10 alphanumeric characters or hyphens
 * @requirements 12.6 - Invoice prefix (1-10 alphanumeric characters or hyphens, default: "CC-")
 *
 * @param prefix - The invoice prefix to validate
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateInvoicePrefix(prefix: string): ValidationResult {
  if (!prefix || prefix.trim() === '') {
    return { valid: false, error: 'Invoice prefix is required' };
  }

  const trimmedPrefix = prefix.trim();

  // Check length (1-10 characters)
  if (trimmedPrefix.length < 1) {
    return { valid: false, error: 'Invoice prefix must be at least 1 character' };
  }

  if (trimmedPrefix.length > 10) {
    return { valid: false, error: 'Invoice prefix must not exceed 10 characters' };
  }

  // Pattern: alphanumeric and hyphens only
  const prefixPattern = /^[A-Za-z0-9\-]+$/;

  if (!prefixPattern.test(trimmedPrefix)) {
    return {
      valid: false,
      error: 'Invoice prefix can only contain letters, numbers, and hyphens',
    };
  }

  return { valid: true };
}

/**
 * Validates a bank account number
 *
 * @description Bank account number must be 9-18 digits
 * @requirements 12.4 - Account Number (9-18 digits)
 *
 * @param accountNumber - The account number to validate
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateBankAccountNumber(accountNumber: string): ValidationResult {
  // Account number is optional, so empty is valid
  if (!accountNumber || accountNumber.trim() === '') {
    return { valid: true };
  }

  // Remove any spaces (commonly formatted with spaces)
  const cleanedNumber = accountNumber.replace(/\s/g, '');

  // Check if contains only digits
  if (!/^\d+$/.test(cleanedNumber)) {
    return { valid: false, error: 'Account number must contain only digits' };
  }

  // Check length (9-18 digits)
  if (cleanedNumber.length < 9) {
    return { valid: false, error: 'Account number must be at least 9 digits' };
  }

  if (cleanedNumber.length > 18) {
    return { valid: false, error: 'Account number must not exceed 18 digits' };
  }

  return { valid: true };
}

/**
 * Validates an Instagram handle
 *
 * @description Instagram handle must be max 30 characters, alphanumeric and underscores only
 * @requirements 12.1 - Instagram Handle (maximum 30 characters, alphanumeric and underscores only)
 *
 * @param handle - The Instagram handle to validate
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateInstagramHandle(handle: string): ValidationResult {
  // Instagram handle is optional, so empty is valid
  if (!handle || handle.trim() === '') {
    return { valid: true };
  }

  // Remove @ prefix if present (users often include it)
  let trimmedHandle = handle.trim();
  if (trimmedHandle.startsWith('@')) {
    trimmedHandle = trimmedHandle.substring(1);
  }

  // Check max length (30 characters)
  if (trimmedHandle.length > 30) {
    return { valid: false, error: 'Instagram handle must not exceed 30 characters' };
  }

  // Pattern: alphanumeric and underscores only
  const handlePattern = /^[A-Za-z0-9_]+$/;

  if (!handlePattern.test(trimmedHandle)) {
    return {
      valid: false,
      error: 'Instagram handle can only contain letters, numbers, and underscores',
    };
  }

  return { valid: true };
}

/**
 * Validates a service quantity
 *
 * @description Quantity must be a whole number between 1 and 9999
 * @requirements 2.1 - QTY (quantity as whole number from 1 to 9999)
 *
 * @param quantity - The quantity to validate
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateServiceQuantity(quantity: number | string): ValidationResult {
  const numQuantity = typeof quantity === 'string' ? parseInt(quantity, 10) : quantity;

  // Check if it's a valid number
  if (isNaN(numQuantity)) {
    return { valid: false, error: 'Quantity must be a valid number' };
  }

  // Check if it's a whole number
  if (!Number.isInteger(numQuantity)) {
    return { valid: false, error: 'Quantity must be a whole number' };
  }

  // Check minimum value
  if (numQuantity < 1) {
    return { valid: false, error: 'Quantity must be at least 1' };
  }

  // Check maximum value
  if (numQuantity > 9999) {
    return { valid: false, error: 'Quantity cannot exceed 9999' };
  }

  return { valid: true };
}

/**
 * Validates a default quantity for services (1-999 range)
 *
 * @description Default quantity must be between 1 and 999
 * @requirements 6.1 - Default Quantity (integer, 1 to 999, default: 1)
 *
 * @param quantity - The default quantity to validate
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateDefaultQuantity(quantity: number | string): ValidationResult {
  const numQuantity = typeof quantity === 'string' ? parseInt(quantity, 10) : quantity;

  // Check if it's a valid number
  if (isNaN(numQuantity)) {
    return { valid: false, error: 'Default quantity must be a valid number' };
  }

  // Check if it's a whole number
  if (!Number.isInteger(numQuantity)) {
    return { valid: false, error: 'Default quantity must be a whole number' };
  }

  // Check minimum value
  if (numQuantity < 1) {
    return { valid: false, error: 'Default quantity must be at least 1' };
  }

  // Check maximum value (999 for default quantity)
  if (numQuantity > 999) {
    return { valid: false, error: 'Default quantity cannot exceed 999' };
  }

  return { valid: true };
}
