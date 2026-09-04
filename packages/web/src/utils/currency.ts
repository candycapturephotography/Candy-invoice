/**
 * Currency Formatting Utilities
 *
 * @description Provides Indian Rupee formatting functions using the Indian numbering system
 * @requirements 7.5 Display amounts in Indian Rupee format with comma separators
 * @requirements 1.13 Indian numbering format (e.g., ₹1,20,000.00)
 * @requirements 10.3-10.5 Dashboard monetary value display
 */

/**
 * Formats a number as Indian currency (INR) using the Indian numbering system.
 *
 * The Indian numbering system groups digits as follows:
 * - First group from right: 3 digits (hundreds)
 * - All subsequent groups: 2 digits (thousands, lakhs, crores)
 *
 * Examples:
 * - 100 → "₹100.00"
 * - 1000 → "₹1,000.00"
 * - 10000 → "₹10,000.00"
 * - 100000 → "₹1,00,000.00"
 * - 120000 → "₹1,20,000.00"
 * - 1000000 → "₹10,00,000.00"
 * - 10000000 → "₹1,00,00,000.00"
 * - 99999999.99 → "₹9,99,99,999.99"
 *
 * @param amount - The numeric amount to format (must be a finite number)
 * @returns Formatted string with ₹ symbol, Indian comma placement, and exactly 2 decimal places
 *
 * @example
 * ```typescript
 * formatIndianCurrency(120000);     // "₹1,20,000.00"
 * formatIndianCurrency(1000000);    // "₹10,00,000.00"
 * formatIndianCurrency(100);        // "₹100.00"
 * formatIndianCurrency(99999999.99); // "₹9,99,99,999.99"
 * formatIndianCurrency(0);          // "₹0.00"
 * formatIndianCurrency(-5000);      // "-₹5,000.00"
 * ```
 *
 * @throws {Error} If the input is not a finite number
 */
export function formatIndianCurrency(amount: number): string {
  // Validate input
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    throw new Error('Amount must be a finite number');
  }

  // Handle negative numbers
  const isNegative = amount < 0;
  const absoluteAmount = Math.abs(amount);

  // Format to exactly 2 decimal places
  const fixedAmount = absoluteAmount.toFixed(2);

  // Split into integer and decimal parts
  const parts = fixedAmount.split('.');
  const integerPart = parts[0] ?? '0';
  const decimalPart = parts[1] ?? '00';

  // Apply Indian numbering system to integer part
  const formattedInteger = formatIndianInteger(integerPart);

  // Combine with Rupee symbol and decimal part
  const formattedAmount = `₹${formattedInteger}.${decimalPart}`;

  return isNegative ? `-${formattedAmount}` : formattedAmount;
}

/**
 * Formats an integer string using Indian numbering system.
 *
 * Indian numbering places commas as follows:
 * - First comma after 3 digits from the right
 * - Subsequent commas every 2 digits
 *
 * @param integerStr - String representation of the integer part
 * @returns Formatted string with Indian-style comma placement
 *
 * @internal
 */
function formatIndianInteger(integerStr: string): string {
  const length = integerStr.length;

  // No commas needed for 3 or fewer digits
  if (length <= 3) {
    return integerStr;
  }

  // For 4+ digits, we need Indian-style formatting
  // Split the string: last 3 digits form the first group, then groups of 2

  // Get the last 3 digits (hundreds group)
  const lastThree = integerStr.slice(-3);

  // Get everything before the last 3 digits
  const remaining = integerStr.slice(0, -3);

  // Format the remaining part with commas every 2 digits (from right)
  const formattedRemaining = formatInGroupsOfTwo(remaining);

  return `${formattedRemaining},${lastThree}`;
}

/**
 * Formats a string with commas every 2 digits from the right.
 *
 * @param str - String to format
 * @returns Formatted string with commas every 2 digits
 *
 * @internal
 */
function formatInGroupsOfTwo(str: string): string {
  const length = str.length;

  if (length <= 2) {
    return str;
  }

  // Build the result by inserting commas every 2 digits from the right
  const parts: string[] = [];
  let position = length;

  while (position > 0) {
    const start = Math.max(0, position - 2);
    parts.unshift(str.slice(start, position));
    position = start;
  }

  return parts.join(',');
}

/**
 * Parses a formatted Indian currency string back to a number.
 *
 * @param formattedAmount - A string in the format "₹X,XX,XXX.XX" or similar
 * @returns The numeric value, or NaN if parsing fails
 *
 * @example
 * ```typescript
 * parseIndianCurrency("₹1,20,000.00"); // 120000
 * parseIndianCurrency("₹100.00");       // 100
 * parseIndianCurrency("-₹5,000.00");    // -5000
 * parseIndianCurrency("invalid");       // NaN
 * ```
 */
export function parseIndianCurrency(formattedAmount: string): number {
  if (typeof formattedAmount !== 'string') {
    return NaN;
  }

  // Check for negative
  const isNegative = formattedAmount.startsWith('-');

  // Remove the Rupee symbol, commas, spaces, and leading minus sign
  const cleanedString = formattedAmount
    .replace(/^-/, '')
    .replace(/₹/g, '')
    .replace(/,/g, '')
    .trim();

  if (cleanedString === '') {
    return NaN;
  }

  const value = parseFloat(cleanedString);

  if (isNaN(value)) {
    return NaN;
  }

  return isNegative ? -value : value;
}
