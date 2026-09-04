/**
 * CandyCapture Photography Invoice Application
 * Data Export Service
 *
 * @description Provides data export functionality for backup purposes.
 * Creates JSON backup files containing all customers, invoices, services, and settings.
 *
 * @requirements 16.3 Export data function with JSON format
 * @requirements 16.10 Exclude authentication tokens and passwords
 * @requirements 16.11 Complete within 30 seconds for up to 10,000 invoices
 */

import { db } from './db';
import type { Customer, Invoice, Service, Settings } from '../types/models';

/**
 * Export data version for backward compatibility
 * Increment when making breaking changes to the export format
 */
export const EXPORT_VERSION = '1.0.0';

/**
 * Structure of the exported JSON data
 *
 * @description Contains all data entities organized by type,
 * along with metadata for version tracking and import validation.
 *
 * @see Requirement 16.3 Export all customers, invoices, payment records, services, and settings
 */
export interface ExportData {
  /**
   * Export format version for compatibility checking
   */
  version: string;

  /**
   * ISO 8601 timestamp when the export was created
   * @format date-time
   */
  exportDate: string;

  /**
   * Application identifier
   */
  application: 'CandyCapture Photography';

  /**
   * Data sections containing all exportable entities
   */
  data: {
    /**
     * All customer records
     */
    customers: Customer[];

    /**
     * All invoice records with embedded payments
     */
    invoices: Invoice[];

    /**
     * All service definitions
     */
    services: Service[];

    /**
     * Application settings (sensitive fields excluded)
     */
    settings: SanitizedSettings | null;
  };

  /**
   * Summary statistics for validation
   */
  metadata: {
    customerCount: number;
    invoiceCount: number;
    serviceCount: number;
    hasSettings: boolean;
  };
}

/**
 * Settings with sensitive fields removed
 *
 * @description Excludes any potential sensitive data from settings export.
 * Currently settings don't contain passwords/tokens, but this provides
 * a clear interface for future-proofing.
 *
 * @see Requirement 16.10 Exclude authentication tokens and passwords
 */
export type SanitizedSettings = Omit<Settings, 'id'> & { id: string };

/**
 * Generates the export filename with current date
 *
 * @description Creates a filename in the format "CandyCapture-Backup-YYYY-MM-DD.json"
 * using the current date.
 *
 * @see Requirement 16.3 Filename format requirement
 *
 * @returns Formatted filename string
 *
 * @example
 * ```typescript
 * const filename = generateExportFilename();
 * // Returns: "CandyCapture-Backup-2026-09-03.json"
 * ```
 */
export function generateExportFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `CandyCapture-Backup-${year}-${month}-${day}.json`;
}

/**
 * Sanitizes settings to remove any potentially sensitive fields
 *
 * @description Removes authentication tokens, passwords, and other sensitive
 * data from settings before export. Currently Settings don't contain such
 * fields, but this function ensures future compatibility.
 *
 * @see Requirement 16.10 Exclude authentication tokens and passwords
 *
 * @param settings - Raw settings object
 * @returns Sanitized settings safe for export
 */
function sanitizeSettings(settings: Settings): SanitizedSettings {
  // Create a copy to avoid mutating the original
  const sanitized: SanitizedSettings = { ...settings };

  // Currently no sensitive fields in Settings, but if added in the future:
  // - Remove any 'accessToken' field
  // - Remove any 'refreshToken' field
  // - Remove any 'password' field
  // - Remove any 'apiKey' field

  // The Settings interface doesn't have these fields, but we're being explicit
  // about what we're exporting for security and documentation purposes
  return sanitized;
}

/**
 * Sanitizes customer data to remove any potentially sensitive fields
 *
 * @description Ensures no authentication or sensitive data is included
 * in customer exports.
 *
 * @see Requirement 16.10 Exclude authentication tokens and passwords
 *
 * @param customer - Raw customer object
 * @returns Sanitized customer safe for export
 */
function sanitizeCustomer(customer: Customer): Customer {
  // Create a copy with only known safe fields
  return {
    id: customer.id,
    name: customer.name,
    mobile: customer.mobile,
    email: customer.email,
    address: customer.address,
    eventType: customer.eventType,
    eventDate: customer.eventDate,
    location: customer.location,
    notes: customer.notes,
    invoiceCount: customer.invoiceCount,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    syncStatus: customer.syncStatus,
  };
}

/**
 * Sanitizes invoice data to remove any potentially sensitive fields
 *
 * @description Ensures no authentication or sensitive data is included
 * in invoice exports.
 *
 * @see Requirement 16.10 Exclude authentication tokens and passwords
 *
 * @param invoice - Raw invoice object
 * @returns Sanitized invoice safe for export
 */
function sanitizeInvoice(invoice: Invoice): Invoice {
  // Create a copy with only known safe fields
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    customerId: invoice.customerId,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    services: invoice.services.map((service) => ({
      id: service.id,
      name: service.name,
      quantity: service.quantity,
    })),
    totalAmount: invoice.totalAmount,
    advancePaid: invoice.advancePaid,
    balanceDue: invoice.balanceDue,
    paymentStatus: invoice.paymentStatus,
    payments: invoice.payments.map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      createdAt: payment.createdAt,
    })),
    notes: invoice.notes,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
    syncStatus: invoice.syncStatus,
  };
}

/**
 * Sanitizes service data to remove any potentially sensitive fields
 *
 * @description Ensures no authentication or sensitive data is included
 * in service exports.
 *
 * @see Requirement 16.10 Exclude authentication tokens and passwords
 *
 * @param service - Raw service object
 * @returns Sanitized service safe for export
 */
function sanitizeService(service: Service): Service {
  // Create a copy with only known safe fields
  return {
    id: service.id,
    name: service.name,
    defaultQuantity: service.defaultQuantity,
    enabled: service.enabled,
    displayOrder: service.displayOrder,
    usageCount: service.usageCount,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
}

/**
 * Exports all application data as a JSON structure
 *
 * @description Gathers all customers, invoices (with payment records),
 * services, and settings into a single exportable JSON structure.
 * Excludes authentication tokens and passwords.
 *
 * @see Requirement 16.3 Export all customers, invoices, payment records, services, and settings
 * @see Requirement 16.10 Exclude authentication tokens and passwords
 * @see Requirement 16.11 Complete within 30 seconds for up to 10,000 invoices
 *
 * @returns Promise resolving to the complete export data structure
 *
 * @example
 * ```typescript
 * const exportData = await exportData();
 * console.log(exportData.metadata.invoiceCount); // Number of exported invoices
 * console.log(exportData.version); // "1.0.0"
 * ```
 */
export async function exportData(): Promise<ExportData> {
  // Fetch all data from IndexedDB in parallel for performance
  const [customers, invoices, services, settings] = await Promise.all([
    db.customers.toArray(),
    db.invoices.toArray(),
    db.services.toArray(),
    db.settings.get('settings'),
  ]);

  // Sanitize all data to exclude sensitive fields
  const sanitizedCustomers = customers.map(sanitizeCustomer);
  const sanitizedInvoices = invoices.map(sanitizeInvoice);
  const sanitizedServices = services.map(sanitizeService);
  const sanitizedSettings = settings ? sanitizeSettings(settings) : null;

  // Build the export structure
  const exportResult: ExportData = {
    version: EXPORT_VERSION,
    exportDate: new Date().toISOString(),
    application: 'CandyCapture Photography',
    data: {
      customers: sanitizedCustomers,
      invoices: sanitizedInvoices,
      services: sanitizedServices,
      settings: sanitizedSettings,
    },
    metadata: {
      customerCount: sanitizedCustomers.length,
      invoiceCount: sanitizedInvoices.length,
      serviceCount: sanitizedServices.length,
      hasSettings: sanitizedSettings !== null,
    },
  };

  return exportResult;
}

/**
 * Triggers a browser download of the export data
 *
 * @description Creates a downloadable JSON file from a Blob and triggers
 * the browser's download mechanism. Works across modern browsers.
 *
 * @see Requirement 16.3 Download as JSON file
 *
 * @param blob - The Blob containing the JSON data
 * @param filename - The filename for the downloaded file
 *
 * @example
 * ```typescript
 * const data = await exportData();
 * const jsonString = JSON.stringify(data, null, 2);
 * const blob = new Blob([jsonString], { type: 'application/json' });
 * const filename = generateExportFilename();
 * downloadExportFile(blob, filename);
 * ```
 */
export function downloadExportFile(blob: Blob, filename: string): void {
  // Create a temporary URL for the blob
  const url = URL.createObjectURL(blob);

  // Create a temporary anchor element to trigger the download
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;

  // Append to body, click, and remove (required for Firefox)
  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup: remove the anchor and revoke the object URL
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Convenience function to export and download data in one step
 *
 * @description Combines data export, JSON serialization, and download
 * into a single operation for ease of use.
 *
 * @see Requirement 16.3 Export data function
 *
 * @returns Promise that resolves when download is triggered
 *
 * @example
 * ```typescript
 * // Simple one-liner to export and download
 * await exportAndDownload();
 * ```
 */
export async function exportAndDownload(): Promise<void> {
  // Export all data
  const data = await exportData();

  // Convert to JSON with pretty formatting
  const jsonString = JSON.stringify(data, null, 2);

  // Create blob
  const blob = new Blob([jsonString], { type: 'application/json' });

  // Generate filename and trigger download
  const filename = generateExportFilename();
  downloadExportFile(blob, filename);
}

/**
 * Creates a Blob from export data
 *
 * @description Converts ExportData to a JSON Blob that can be downloaded
 * or used for other purposes (e.g., cloud upload).
 *
 * @param data - The export data structure
 * @param prettyPrint - Whether to format JSON with indentation (default: true)
 * @returns Blob containing the JSON data
 *
 * @example
 * ```typescript
 * const data = await exportData();
 * const blob = createExportBlob(data);
 * console.log(blob.size); // Size in bytes
 * ```
 */
export function createExportBlob(data: ExportData, prettyPrint: boolean = true): Blob {
  const jsonString = prettyPrint
    ? JSON.stringify(data, null, 2)
    : JSON.stringify(data);

  return new Blob([jsonString], { type: 'application/json' });
}
