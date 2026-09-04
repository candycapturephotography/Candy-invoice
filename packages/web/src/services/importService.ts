/**
 * CandyCapture Photography Invoice Application
 * Data Import Service
 *
 * @description Provides data import functionality with JSON validation, merge/replace strategies
 * @requirements 16.4 Import Data function, 16.5 Validate data integrity
 * @requirements 16.6 Abort import on validation failure, 16.7 Merge/Replace strategies
 * @requirements 16.8 Replace confirmation, 16.9 Atomic replace operation
 */

import { db } from './db';
import type { ExportData } from '../types/api';
import type { Customer, Invoice, Service, Settings } from '../types/models';

/**
 * Import result with counts for each entity type
 *
 * @description Returns detailed counts of imported records and any skipped duplicates
 */
export interface ImportResult {
  /**
   * Number of customers imported
   */
  customers: number;

  /**
   * Number of invoices imported
   */
  invoices: number;

  /**
   * Number of services imported
   */
  services: number;

  /**
   * Whether settings were imported (0 or 1)
   */
  settings: number;

  /**
   * Number of records skipped (duplicates in merge mode)
   */
  skipped: number;
}

/**
 * Validation error with detailed information
 */
export interface ValidationError {
  /**
   * Type of validation error
   */
  type: 'structure' | 'required_field' | 'data_type' | 'referential_integrity';

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * Path to the invalid field (e.g., "customers[0].name")
   */
  path?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /**
   * Whether the data passed validation
   */
  valid: boolean;

  /**
   * Array of validation errors (empty if valid)
   */
  errors: ValidationError[];
}

/**
 * Import strategy type
 *
 * @description
 * - 'merge': Add new records, skip duplicates identified by ID
 * - 'replace': Delete all existing data before importing (atomic operation)
 */
export type ImportStrategy = 'merge' | 'replace';

/**
 * Required fields for each entity type
 */
const REQUIRED_CUSTOMER_FIELDS = ['id', 'name', 'mobile', 'eventType', 'eventDate', 'location'] as const;
const REQUIRED_INVOICE_FIELDS = ['id', 'invoiceNumber', 'customerId', 'invoiceDate', 'dueDate', 'services', 'totalAmount'] as const;
const REQUIRED_SERVICE_FIELDS = ['id', 'name', 'defaultQuantity', 'enabled', 'displayOrder'] as const;
const REQUIRED_SETTINGS_FIELDS = ['id', 'businessName', 'address', 'phone', 'email', 'invoicePrefix', 'defaultDueDays'] as const;

/**
 * Validate the structure and content of import data
 *
 * @description Validates JSON structure, required fields, data types, and referential integrity
 * @see Requirement 16.5 Validate data integrity
 *
 * @param data - Unknown data to validate
 * @returns ValidationResult with valid flag and array of errors
 *
 * @example
 * ```typescript
 * const result = validateImportData(parsedJson);
 * if (!result.valid) {
 *   console.error('Validation failed:', result.errors);
 * }
 * ```
 */
export function validateImportData(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  // Check if data is an object
  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      errors: [{
        type: 'structure',
        message: 'Import data must be a valid JSON object',
      }],
    };
  }

  const exportData = data as Partial<ExportData>;

  // Validate top-level structure
  if (!('version' in exportData) || typeof exportData.version !== 'string') {
    errors.push({
      type: 'structure',
      message: 'Missing or invalid "version" field',
      path: 'version',
    });
  }

  if (!('exportedAt' in exportData) || typeof exportData.exportedAt !== 'string') {
    errors.push({
      type: 'structure',
      message: 'Missing or invalid "exportedAt" field',
      path: 'exportedAt',
    });
  }

  // Validate customers array
  if (!Array.isArray(exportData.customers)) {
    errors.push({
      type: 'structure',
      message: 'Missing or invalid "customers" array',
      path: 'customers',
    });
  } else {
    validateCustomers(exportData.customers, errors);
  }

  // Validate invoices array
  if (!Array.isArray(exportData.invoices)) {
    errors.push({
      type: 'structure',
      message: 'Missing or invalid "invoices" array',
      path: 'invoices',
    });
  } else {
    validateInvoices(exportData.invoices, errors);
  }

  // Validate services array
  if (!Array.isArray(exportData.services)) {
    errors.push({
      type: 'structure',
      message: 'Missing or invalid "services" array',
      path: 'services',
    });
  } else {
    validateServices(exportData.services, errors);
  }

  // Validate settings object (can be null/undefined for empty export)
  if (exportData.settings !== null && exportData.settings !== undefined) {
    validateSettings(exportData.settings, errors);
  }

  // Validate referential integrity: all invoice customerIds should reference existing customers
  if (Array.isArray(exportData.customers) && Array.isArray(exportData.invoices)) {
    const customerIds = new Set(
      (exportData.customers as Array<Record<string, unknown>>)
        .filter(c => c && typeof c === 'object' && 'id' in c)
        .map(c => c.id as string)
    );

    (exportData.invoices as Array<Record<string, unknown>>).forEach((invoice, index) => {
      if (invoice && typeof invoice === 'object' && 'customerId' in invoice) {
        const customerId = invoice.customerId as string;
        if (customerId && !customerIds.has(customerId)) {
          errors.push({
            type: 'referential_integrity',
            message: `Invoice references non-existent customer ID: ${customerId}`,
            path: `invoices[${index}].customerId`,
          });
        }
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate customers array
 */
function validateCustomers(customers: unknown[], errors: ValidationError[]): void {
  customers.forEach((customer, index) => {
    if (!customer || typeof customer !== 'object') {
      errors.push({
        type: 'data_type',
        message: `Customer at index ${index} is not a valid object`,
        path: `customers[${index}]`,
      });
      return;
    }

    const customerObj = customer as Record<string, unknown>;

    REQUIRED_CUSTOMER_FIELDS.forEach(field => {
      if (!(field in customerObj) || customerObj[field] === null || customerObj[field] === undefined) {
        errors.push({
          type: 'required_field',
          message: `Customer at index ${index} is missing required field: ${field}`,
          path: `customers[${index}].${field}`,
        });
      }
    });

    // Validate data types
    if ('name' in customerObj && typeof customerObj.name !== 'string') {
      errors.push({
        type: 'data_type',
        message: `Customer at index ${index} has invalid "name" type (expected string)`,
        path: `customers[${index}].name`,
      });
    }

    if ('mobile' in customerObj && typeof customerObj.mobile !== 'string') {
      errors.push({
        type: 'data_type',
        message: `Customer at index ${index} has invalid "mobile" type (expected string)`,
        path: `customers[${index}].mobile`,
      });
    }

    if ('invoiceCount' in customerObj && typeof customerObj.invoiceCount !== 'number') {
      errors.push({
        type: 'data_type',
        message: `Customer at index ${index} has invalid "invoiceCount" type (expected number)`,
        path: `customers[${index}].invoiceCount`,
      });
    }
  });
}

/**
 * Validate invoices array
 */
function validateInvoices(invoices: unknown[], errors: ValidationError[]): void {
  invoices.forEach((invoice, index) => {
    if (!invoice || typeof invoice !== 'object') {
      errors.push({
        type: 'data_type',
        message: `Invoice at index ${index} is not a valid object`,
        path: `invoices[${index}]`,
      });
      return;
    }

    const invoiceObj = invoice as Record<string, unknown>;

    REQUIRED_INVOICE_FIELDS.forEach(field => {
      if (!(field in invoiceObj) || invoiceObj[field] === null || invoiceObj[field] === undefined) {
        errors.push({
          type: 'required_field',
          message: `Invoice at index ${index} is missing required field: ${field}`,
          path: `invoices[${index}].${field}`,
        });
      }
    });

    // Validate data types
    if ('totalAmount' in invoiceObj && typeof invoiceObj.totalAmount !== 'number') {
      errors.push({
        type: 'data_type',
        message: `Invoice at index ${index} has invalid "totalAmount" type (expected number)`,
        path: `invoices[${index}].totalAmount`,
      });
    }

    if ('services' in invoiceObj && !Array.isArray(invoiceObj.services)) {
      errors.push({
        type: 'data_type',
        message: `Invoice at index ${index} has invalid "services" type (expected array)`,
        path: `invoices[${index}].services`,
      });
    }

    if ('payments' in invoiceObj && !Array.isArray(invoiceObj.payments)) {
      errors.push({
        type: 'data_type',
        message: `Invoice at index ${index} has invalid "payments" type (expected array)`,
        path: `invoices[${index}].payments`,
      });
    }
  });
}

/**
 * Validate services array
 */
function validateServices(services: unknown[], errors: ValidationError[]): void {
  services.forEach((service, index) => {
    if (!service || typeof service !== 'object') {
      errors.push({
        type: 'data_type',
        message: `Service at index ${index} is not a valid object`,
        path: `services[${index}]`,
      });
      return;
    }

    const serviceObj = service as Record<string, unknown>;

    REQUIRED_SERVICE_FIELDS.forEach(field => {
      if (!(field in serviceObj) || serviceObj[field] === null || serviceObj[field] === undefined) {
        errors.push({
          type: 'required_field',
          message: `Service at index ${index} is missing required field: ${field}`,
          path: `services[${index}].${field}`,
        });
      }
    });

    // Validate data types
    if ('name' in serviceObj && typeof serviceObj.name !== 'string') {
      errors.push({
        type: 'data_type',
        message: `Service at index ${index} has invalid "name" type (expected string)`,
        path: `services[${index}].name`,
      });
    }

    if ('defaultQuantity' in serviceObj && typeof serviceObj.defaultQuantity !== 'number') {
      errors.push({
        type: 'data_type',
        message: `Service at index ${index} has invalid "defaultQuantity" type (expected number)`,
        path: `services[${index}].defaultQuantity`,
      });
    }

    if ('enabled' in serviceObj && typeof serviceObj.enabled !== 'boolean') {
      errors.push({
        type: 'data_type',
        message: `Service at index ${index} has invalid "enabled" type (expected boolean)`,
        path: `services[${index}].enabled`,
      });
    }
  });
}

/**
 * Validate settings object
 */
function validateSettings(settings: unknown, errors: ValidationError[]): void {
  if (!settings || typeof settings !== 'object') {
    errors.push({
      type: 'data_type',
      message: 'Settings is not a valid object',
      path: 'settings',
    });
    return;
  }

  const settingsObj = settings as Record<string, unknown>;

  REQUIRED_SETTINGS_FIELDS.forEach(field => {
    if (!(field in settingsObj) || settingsObj[field] === null || settingsObj[field] === undefined) {
      errors.push({
        type: 'required_field',
        message: `Settings is missing required field: ${field}`,
        path: `settings.${field}`,
      });
    }
  });

  // Validate data types
  if ('businessName' in settingsObj && typeof settingsObj.businessName !== 'string') {
    errors.push({
      type: 'data_type',
      message: 'Settings has invalid "businessName" type (expected string)',
      path: 'settings.businessName',
    });
  }

  if ('defaultDueDays' in settingsObj && typeof settingsObj.defaultDueDays !== 'number') {
    errors.push({
      type: 'data_type',
      message: 'Settings has invalid "defaultDueDays" type (expected number)',
      path: 'settings.defaultDueDays',
    });
  }
}

/**
 * Import data using the specified strategy
 *
 * @description Imports data from an ExportData object using either merge or replace strategy
 * @see Requirement 16.4 Import Data function
 * @see Requirement 16.7 Merge (add new, skip duplicates) and Replace (delete all before import)
 * @see Requirement 16.9 Atomic replace operation with rollback on failure
 *
 * @param data - Validated ExportData object
 * @param mode - Import strategy: 'merge' or 'replace'
 * @returns ImportResult with counts of imported and skipped records
 * @throws Error if import fails (data will be rolled back in replace mode)
 *
 * @example
 * ```typescript
 * // Merge import - adds new records, skips duplicates
 * const result = await importData(exportData, 'merge');
 *
 * // Replace import - deletes all existing data first
 * const result = await importData(exportData, 'replace');
 * ```
 */
export async function importData(data: ExportData, mode: ImportStrategy): Promise<ImportResult> {
  const result: ImportResult = {
    customers: 0,
    invoices: 0,
    services: 0,
    settings: 0,
    skipped: 0,
  };

  if (mode === 'replace') {
    return importWithReplace(data, result);
  } else {
    return importWithMerge(data, result);
  }
}

/**
 * Import data with replace strategy (atomic delete and import)
 *
 * @description Deletes all existing data and imports new data as an atomic operation.
 * If import fails, rolls back to previous state.
 * @see Requirement 16.9 Atomic replace operation
 */
async function importWithReplace(data: ExportData, result: ImportResult): Promise<ImportResult> {
  // Store backup for potential rollback
  const backup = {
    customers: await db.customers.toArray(),
    invoices: await db.invoices.toArray(),
    services: await db.services.toArray(),
    settings: await db.settings.toArray(),
  };

  try {
    // Perform atomic transaction: clear all and import
    await db.transaction('rw', [db.customers, db.invoices, db.services, db.settings], async () => {
      // Clear all existing data
      await db.customers.clear();
      await db.invoices.clear();
      await db.services.clear();
      await db.settings.clear();

      // Import customers
      if (data.customers && data.customers.length > 0) {
        const customers = prepareCustomers(data.customers as Customer[]);
        await db.customers.bulkAdd(customers);
        result.customers = customers.length;
      }

      // Import invoices
      if (data.invoices && data.invoices.length > 0) {
        const invoices = prepareInvoices(data.invoices as Invoice[]);
        await db.invoices.bulkAdd(invoices);
        result.invoices = invoices.length;
      }

      // Import services
      if (data.services && data.services.length > 0) {
        const services = prepareServices(data.services as Service[]);
        await db.services.bulkAdd(services);
        result.services = services.length;
      }

      // Import settings
      if (data.settings) {
        const settings = prepareSettings(data.settings as Settings);
        await db.settings.put(settings);
        result.settings = 1;
      }
    });

    return result;
  } catch (error) {
    // Rollback: restore from backup
    console.error('Import failed, rolling back:', error);

    try {
      await db.transaction('rw', [db.customers, db.invoices, db.services, db.settings], async () => {
        await db.customers.clear();
        await db.invoices.clear();
        await db.services.clear();
        await db.settings.clear();

        if (backup.customers.length > 0) {
          await db.customers.bulkAdd(backup.customers);
        }
        if (backup.invoices.length > 0) {
          await db.invoices.bulkAdd(backup.invoices);
        }
        if (backup.services.length > 0) {
          await db.services.bulkAdd(backup.services);
        }
        if (backup.settings.length > 0) {
          await db.settings.bulkAdd(backup.settings);
        }
      });
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
      throw new Error('Import failed and rollback failed. Data may be in inconsistent state.');
    }

    throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Import data with merge strategy (add new, skip duplicates)
 *
 * @description Adds new records and skips records with existing IDs.
 * @see Requirement 16.7 Merge strategy - add new records, skip duplicates identified by ID
 */
async function importWithMerge(data: ExportData, result: ImportResult): Promise<ImportResult> {
  // Get existing IDs for duplicate detection
  const existingCustomerIds = new Set((await db.customers.toArray()).map(c => c.id));
  const existingInvoiceIds = new Set((await db.invoices.toArray()).map(i => i.id));
  const existingServiceIds = new Set((await db.services.toArray()).map(s => s.id));
  const existingSettings = await db.settings.get('settings');

  await db.transaction('rw', [db.customers, db.invoices, db.services, db.settings], async () => {
    // Import customers (skip duplicates)
    if (data.customers && data.customers.length > 0) {
      const customers = prepareCustomers(data.customers as Customer[]);
      const newCustomers = customers.filter(c => !existingCustomerIds.has(c.id));
      const skippedCustomers = customers.length - newCustomers.length;

      if (newCustomers.length > 0) {
        await db.customers.bulkAdd(newCustomers);
      }

      result.customers = newCustomers.length;
      result.skipped += skippedCustomers;
    }

    // Import invoices (skip duplicates)
    if (data.invoices && data.invoices.length > 0) {
      const invoices = prepareInvoices(data.invoices as Invoice[]);
      const newInvoices = invoices.filter(i => !existingInvoiceIds.has(i.id));
      const skippedInvoices = invoices.length - newInvoices.length;

      if (newInvoices.length > 0) {
        await db.invoices.bulkAdd(newInvoices);
      }

      result.invoices = newInvoices.length;
      result.skipped += skippedInvoices;
    }

    // Import services (skip duplicates)
    if (data.services && data.services.length > 0) {
      const services = prepareServices(data.services as Service[]);
      const newServices = services.filter(s => !existingServiceIds.has(s.id));
      const skippedServices = services.length - newServices.length;

      if (newServices.length > 0) {
        await db.services.bulkAdd(newServices);
      }

      result.services = newServices.length;
      result.skipped += skippedServices;
    }

    // Import settings (skip if exists, otherwise add)
    if (data.settings) {
      if (!existingSettings) {
        const settings = prepareSettings(data.settings as Settings);
        await db.settings.put(settings);
        result.settings = 1;
      } else {
        result.skipped += 1;
      }
    }
  });

  return result;
}

/**
 * Prepare customers for import - ensure syncStatus is set
 */
function prepareCustomers(customers: Customer[]): Customer[] {
  const now = new Date().toISOString();
  return customers.map(customer => ({
    ...customer,
    syncStatus: customer.syncStatus || 'pending',
    createdAt: customer.createdAt || now,
    updatedAt: customer.updatedAt || now,
    invoiceCount: customer.invoiceCount ?? 0,
  }));
}

/**
 * Prepare invoices for import - ensure all required fields
 */
function prepareInvoices(invoices: Invoice[]): Invoice[] {
  const now = new Date().toISOString();
  return invoices.map(invoice => ({
    ...invoice,
    syncStatus: invoice.syncStatus || 'pending',
    createdAt: invoice.createdAt || now,
    updatedAt: invoice.updatedAt || now,
    advancePaid: invoice.advancePaid ?? 0,
    balanceDue: invoice.balanceDue ?? invoice.totalAmount - (invoice.advancePaid ?? 0),
    paymentStatus: invoice.paymentStatus || 'PENDING',
    payments: invoice.payments || [],
  }));
}

/**
 * Prepare services for import - ensure all required fields
 */
function prepareServices(services: Service[]): Service[] {
  const now = new Date().toISOString();
  return services.map(service => ({
    ...service,
    createdAt: service.createdAt || now,
    updatedAt: service.updatedAt || now,
    usageCount: service.usageCount ?? 0,
  }));
}

/**
 * Prepare settings for import - ensure ID is 'settings'
 */
function prepareSettings(settings: Settings): Settings {
  return {
    ...settings,
    id: 'settings',
    updatedAt: settings.updatedAt || new Date().toISOString(),
  };
}

/**
 * Parse and validate a JSON file for import
 *
 * @description Reads a File object, parses JSON, and validates the structure
 * @see Requirement 16.4 Import Data from previously exported JSON file
 * @see Requirement 16.5 Validate data integrity
 *
 * @param file - File object from file input
 * @returns Object with parsed data (if valid) or validation errors
 * @throws Error if file cannot be read
 *
 * @example
 * ```typescript
 * const result = await parseImportFile(file);
 * if (result.valid) {
 *   const importResult = await importData(result.data!, 'merge');
 * } else {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 */
export async function parseImportFile(
  file: File
): Promise<{ valid: boolean; data?: ExportData; errors: ValidationError[] }> {
  // Validate file type
  if (!file.name.toLowerCase().endsWith('.json')) {
    return {
      valid: false,
      errors: [{
        type: 'structure',
        message: 'File must be a JSON file (.json extension)',
      }],
    };
  }

  // Read file content
  let content: string;
  try {
    content = await file.text();
  } catch {
    return {
      valid: false,
      errors: [{
        type: 'structure',
        message: 'Failed to read file content',
      }],
    };
  }

  // Parse JSON
  let parsedData: unknown;
  try {
    parsedData = JSON.parse(content);
  } catch (parseError) {
    return {
      valid: false,
      errors: [{
        type: 'structure',
        message: `Invalid JSON format: ${parseError instanceof Error ? parseError.message : 'Parse error'}`,
      }],
    };
  }

  // Validate data structure
  const validationResult = validateImportData(parsedData);

  if (!validationResult.valid) {
    return {
      valid: false,
      errors: validationResult.errors,
    };
  }

  return {
    valid: true,
    data: parsedData as ExportData,
    errors: [],
  };
}

/**
 * Import service for convenient access to all import functions
 */
export const importService = {
  validateImportData,
  importData,
  parseImportFile,
};

export default importService;
