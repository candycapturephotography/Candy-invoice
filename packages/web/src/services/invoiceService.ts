/**
 * CandyCapture Photography Invoice Application
 * Invoice Storage Service
 *
 * @description Provides CRUD operations for invoices with offline support,
 * automatic balance/status calculation, and sync queue integration.
 *
 * @requirements 11.1 Invoice list with filtering and pagination
 * @requirements 11.4 Payment status filter
 * @requirements 11.5 Date range filters
 * @requirements 4.6 Temporary invoice IDs for offline creation
 */

import { db, DB_CONSTANTS } from './db';
import type { Invoice, Payment, PaymentStatus, SyncOperation } from '../types';
import { calculateBalanceDue, calculatePaymentStatus } from '../utils/payment';

/**
 * Options for querying invoices
 */
export interface InvoiceQueryOptions {
  /** Page number (1-indexed, defaults to 1) */
  page?: number;
  /** Number of items per page (defaults to 20) */
  pageSize?: number;
  /** Filter by payment status */
  status?: PaymentStatus;
  /** Filter invoices on or after this date (ISO 8601) */
  fromDate?: string;
  /** Filter invoices on or before this date (ISO 8601) */
  toDate?: string;
  /** Filter by customer ID */
  customerId?: string;
  /** Search by invoice number or customer name (requires join) */
  search?: string;
}

/**
 * Result of paginated invoice query
 */
export interface PaginatedInvoiceResult {
  /** Array of invoices for the current page */
  items: Invoice[];
  /** Total count of invoices matching the filters */
  totalCount: number;
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there are more pages */
  hasNextPage: boolean;
  /** Whether there are previous pages */
  hasPreviousPage: boolean;
}

/**
 * Statistics for dashboard display
 */
export interface InvoiceStats {
  /** Total value of all invoices */
  totalValue: number;
  /** Total advance paid across all invoices */
  totalAdvance: number;
  /** Total balance due across all invoices */
  totalBalance: number;
  /** Count of invoices by payment status */
  countByStatus: {
    PENDING: number;
    PARTIALLY_PAID: number;
    PAID: number;
  };
  /** Total number of invoices */
  totalInvoices: number;
}

/**
 * Counter for generating temporary invoice IDs when offline
 */
let tempInvoiceCounter = 1;

/**
 * Generates a temporary invoice ID for offline invoice creation
 *
 * @description Creates IDs in format "TEMP-NNNN" where NNNN is a 4-digit number
 * @see Requirement 4.6 Temporary local ID format
 *
 * @returns A unique temporary invoice number
 *
 * @example
 * ```typescript
 * const tempId = generateTempInvoiceNumber(); // "TEMP-0001"
 * ```
 */
export function generateTempInvoiceNumber(): string {
  const number = String(tempInvoiceCounter).padStart(4, '0');
  tempInvoiceCounter++;
  return `TEMP-${number}`;
}

/**
 * Resets the temporary invoice counter
 * @description Used primarily for testing purposes
 */
export function resetTempInvoiceCounter(): void {
  tempInvoiceCounter = 1;
}

/**
 * Checks if an invoice number is a temporary ID
 *
 * @param invoiceNumber - The invoice number to check
 * @returns True if the invoice number starts with "TEMP-"
 */
export function isTempInvoiceNumber(invoiceNumber: string): boolean {
  return invoiceNumber.startsWith('TEMP-');
}

/**
 * Gets invoices with pagination and filtering
 *
 * @description Retrieves invoices from IndexedDB with support for pagination,
 * date range filtering, status filtering, and search.
 *
 * @see Requirement 11.1 Invoice list with columns
 * @see Requirement 11.4 Payment status filter
 * @see Requirement 11.5 Date range filters
 * @see Requirement 11.7 Pagination with 20 items per page
 *
 * @param options - Query options for filtering and pagination
 * @returns Paginated result with invoices and metadata
 *
 * @example
 * ```typescript
 * // Get first page of all invoices
 * const result = await getInvoices();
 *
 * // Get pending invoices
 * const pending = await getInvoices({ status: 'PENDING' });
 *
 * // Get invoices in date range
 * const ranged = await getInvoices({
 *   fromDate: '2026-01-01',
 *   toDate: '2026-12-31'
 * });
 *
 * // Search with pagination
 * const searched = await getInvoices({
 *   search: 'CC-1001',
 *   page: 1,
 *   pageSize: 20
 * });
 * ```
 */
export async function getInvoices(
  options: InvoiceQueryOptions = {}
): Promise<PaginatedInvoiceResult> {
  const {
    page = 1,
    pageSize = 20,
    status,
    fromDate,
    toDate,
    customerId,
    search,
  } = options;

  // Start with all invoices ordered by invoice date (newest first)
  let collection = db.invoices.orderBy('invoiceDate').reverse();

  // Get all matching records for filtering
  let allInvoices = await collection.toArray();

  // Apply filters
  if (status) {
    allInvoices = allInvoices.filter((inv) => inv.paymentStatus === status);
  }

  if (fromDate) {
    allInvoices = allInvoices.filter((inv) => inv.invoiceDate >= fromDate);
  }

  if (toDate) {
    allInvoices = allInvoices.filter((inv) => inv.invoiceDate <= toDate);
  }

  if (customerId) {
    allInvoices = allInvoices.filter((inv) => inv.customerId === customerId);
  }

  if (search && search.trim().length > 0) {
    const searchLower = search.toLowerCase().trim();
    allInvoices = allInvoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(searchLower) ||
        // Note: For customer name search, we'd need to join with customers table
        // For now, we only search by invoice number directly
        inv.customerId.toLowerCase().includes(searchLower)
    );
  }

  // Calculate pagination
  const totalCount = allInvoices.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const offset = (page - 1) * pageSize;
  const items = allInvoices.slice(offset, offset + pageSize);

  return {
    items,
    totalCount,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Gets a single invoice by ID
 *
 * @description Retrieves an invoice with all its payment history
 * @see Requirement 11.8 Display full invoice details
 *
 * @param id - The invoice ID to retrieve
 * @returns The invoice if found, undefined otherwise
 *
 * @example
 * ```typescript
 * const invoice = await getInvoiceById('inv_abc123');
 * if (invoice) {
 *   console.log(invoice.invoiceNumber);
 * }
 * ```
 */
export async function getInvoiceById(id: string): Promise<Invoice | undefined> {
  return db.invoices.get(id);
}

/**
 * Gets an invoice by its invoice number
 *
 * @param invoiceNumber - The invoice number (e.g., "CC-1001")
 * @returns The invoice if found, undefined otherwise
 */
export async function getInvoiceByNumber(
  invoiceNumber: string
): Promise<Invoice | undefined> {
  return db.invoices.where('invoiceNumber').equals(invoiceNumber).first();
}

/**
 * Saves an invoice (create or update)
 *
 * @description Creates a new invoice or updates an existing one.
 * Automatically calculates balance due and payment status.
 * Queues the operation for synchronization.
 *
 * @see Requirement 4.6 Handle temporary invoice IDs for offline creation
 * @see Requirement 7.1 Automatic balance calculation
 * @see Requirement 7.2-7.4 Automatic payment status calculation
 *
 * @param invoice - The invoice to save
 * @returns The saved invoice with calculated fields
 *
 * @example
 * ```typescript
 * // Create new invoice
 * const newInvoice = await saveInvoice({
 *   id: crypto.randomUUID(),
 *   invoiceNumber: generateTempInvoiceNumber(),
 *   customerId: 'cust_123',
 *   invoiceDate: '2026-09-03',
 *   dueDate: '2026-09-18',
 *   services: [{ id: 'svc_001', name: 'Traditional Photo', quantity: 1 }],
 *   totalAmount: 120000,
 *   advancePaid: 20000,
 *   balanceDue: 0, // Will be calculated
 *   paymentStatus: 'PENDING', // Will be calculated
 *   payments: [],
 *   createdAt: new Date().toISOString(),
 *   updatedAt: new Date().toISOString(),
 *   syncStatus: 'pending'
 * });
 * ```
 */
export async function saveInvoice(invoice: Invoice): Promise<Invoice> {
  const now = new Date().toISOString();

  // Calculate total advance from payments
  const totalAdvance = invoice.payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  // Calculate balance due and payment status
  const balanceDue = calculateBalanceDue(invoice.totalAmount, totalAdvance);
  const paymentStatus = calculatePaymentStatus(invoice.totalAmount, totalAdvance);

  // Check if this is an update or create
  const existingInvoice = await db.invoices.get(invoice.id);
  const isUpdate = !!existingInvoice;

  // Prepare the invoice with calculated fields
  const invoiceToSave: Invoice = {
    ...invoice,
    advancePaid: totalAdvance,
    balanceDue,
    paymentStatus,
    updatedAt: now,
    createdAt: isUpdate ? existingInvoice!.createdAt : now,
    syncStatus: 'pending',
  };

  // Save to database
  await db.invoices.put(invoiceToSave);

  // Queue sync operation
  await queueSyncOperation({
    type: isUpdate ? 'UPDATE' : 'CREATE',
    entity: 'invoice',
    entityId: invoice.id,
    payload: invoiceToSave,
  });

  return invoiceToSave;
}

/**
 * Deletes an invoice
 *
 * @description Removes an invoice from the local database and queues
 * the deletion for synchronization.
 *
 * @param id - The ID of the invoice to delete
 * @returns True if the invoice was deleted, false if not found
 *
 * @example
 * ```typescript
 * const deleted = await deleteInvoice('inv_abc123');
 * if (deleted) {
 *   console.log('Invoice deleted');
 * }
 * ```
 */
export async function deleteInvoice(id: string): Promise<boolean> {
  const existingInvoice = await db.invoices.get(id);

  if (!existingInvoice) {
    return false;
  }

  // Delete from database
  await db.invoices.delete(id);

  // Queue sync operation (only if not a temp invoice that was never synced)
  if (!isTempInvoiceNumber(existingInvoice.invoiceNumber)) {
    await queueSyncOperation({
      type: 'DELETE',
      entity: 'invoice',
      entityId: id,
      payload: { id },
    });
  }

  return true;
}

/**
 * Adds a payment to an invoice
 *
 * @description Adds a new payment record to an invoice and recalculates
 * the balance due and payment status.
 *
 * @see Requirement 7.9 Support up to 50 payments per invoice
 * @see Requirement 7.10 Recalculate balance and status on payment
 *
 * @param invoiceId - The ID of the invoice
 * @param payment - The payment to add
 * @returns The updated invoice, or undefined if not found
 *
 * @example
 * ```typescript
 * const payment: Payment = {
 *   id: crypto.randomUUID(),
 *   amount: 10000,
 *   paymentDate: '2026-09-05',
 *   createdAt: new Date().toISOString()
 * };
 * const updated = await addPayment('inv_123', payment);
 * ```
 */
export async function addPayment(
  invoiceId: string,
  payment: Payment
): Promise<Invoice | undefined> {
  const invoice = await db.invoices.get(invoiceId);

  if (!invoice) {
    return undefined;
  }

  // Check payment limit (max 50 payments)
  if (invoice.payments.length >= 50) {
    throw new Error('Maximum of 50 payments allowed per invoice');
  }

  // Add the new payment
  const updatedPayments = [...invoice.payments, payment];

  // Save with updated payments (saveInvoice will recalculate balance/status)
  return saveInvoice({
    ...invoice,
    payments: updatedPayments,
  });
}

/**
 * Deletes a payment from an invoice
 *
 * @description Removes a payment record and recalculates the balance
 * due and payment status.
 *
 * @see Requirement 7.12 Delete payment and recalculate
 *
 * @param invoiceId - The ID of the invoice
 * @param paymentId - The ID of the payment to delete
 * @returns The updated invoice, or undefined if not found
 *
 * @example
 * ```typescript
 * const updated = await deletePayment('inv_123', 'pay_456');
 * ```
 */
export async function deletePayment(
  invoiceId: string,
  paymentId: string
): Promise<Invoice | undefined> {
  const invoice = await db.invoices.get(invoiceId);

  if (!invoice) {
    return undefined;
  }

  // Filter out the payment to delete
  const updatedPayments = invoice.payments.filter((p) => p.id !== paymentId);

  // If no payment was removed, return undefined
  if (updatedPayments.length === invoice.payments.length) {
    return undefined;
  }

  // Save with updated payments
  return saveInvoice({
    ...invoice,
    payments: updatedPayments,
  });
}

/**
 * Gets recent invoices for dashboard display
 *
 * @description Retrieves the most recent invoices sorted by invoice date
 *
 * @see Requirement 10.7 Display 10 most recent invoices
 *
 * @param count - Number of recent invoices to retrieve (default 10)
 * @returns Array of recent invoices
 *
 * @example
 * ```typescript
 * const recentInvoices = await getRecentInvoices(10);
 * ```
 */
export async function getRecentInvoices(count: number = 10): Promise<Invoice[]> {
  return db.invoices.orderBy('invoiceDate').reverse().limit(count).toArray();
}

/**
 * Gets invoice statistics for dashboard
 *
 * @description Calculates aggregate statistics across all invoices
 *
 * @see Requirement 10.1-10.6 Dashboard metrics
 *
 * @returns Statistics object with totals and counts
 *
 * @example
 * ```typescript
 * const stats = await getInvoiceStats();
 * console.log(`Total Value: ₹${stats.totalValue}`);
 * console.log(`Pending: ${stats.countByStatus.PENDING}`);
 * ```
 */
export async function getInvoiceStats(): Promise<InvoiceStats> {
  const allInvoices = await db.invoices.toArray();

  const stats: InvoiceStats = {
    totalValue: 0,
    totalAdvance: 0,
    totalBalance: 0,
    countByStatus: {
      PENDING: 0,
      PARTIALLY_PAID: 0,
      PAID: 0,
    },
    totalInvoices: allInvoices.length,
  };

  for (const invoice of allInvoices) {
    stats.totalValue += invoice.totalAmount;
    stats.totalAdvance += invoice.advancePaid;
    stats.totalBalance += invoice.balanceDue;
    stats.countByStatus[invoice.paymentStatus]++;
  }

  // Round currency values to 2 decimal places
  stats.totalValue = Math.round(stats.totalValue * 100) / 100;
  stats.totalAdvance = Math.round(stats.totalAdvance * 100) / 100;
  stats.totalBalance = Math.round(stats.totalBalance * 100) / 100;

  return stats;
}

/**
 * Gets invoices by customer ID
 *
 * @description Retrieves all invoices for a specific customer
 *
 * @param customerId - The customer ID to filter by
 * @returns Array of invoices for the customer
 */
export async function getInvoicesByCustomerId(
  customerId: string
): Promise<Invoice[]> {
  return db.invoices
    .where('customerId')
    .equals(customerId)
    .reverse()
    .sortBy('invoiceDate');
}

/**
 * Gets count of invoices for a customer
 *
 * @description Returns the number of invoices associated with a customer.
 * Used for customer deletion protection.
 *
 * @param customerId - The customer ID
 * @returns Count of invoices
 */
export async function getInvoiceCountByCustomerId(
  customerId: string
): Promise<number> {
  return db.invoices.where('customerId').equals(customerId).count();
}

/**
 * Updates service usage count when invoice is created/deleted
 *
 * @description Increments or decrements the usage count for services
 * used in an invoice. This is used for service deletion protection.
 *
 * @param services - Array of invoice services
 * @param increment - Whether to increment (true) or decrement (false)
 */
export async function updateServiceUsageCounts(
  services: Array<{ id: string }>,
  increment: boolean
): Promise<void> {
  const delta = increment ? 1 : -1;

  await db.transaction('rw', db.services, async () => {
    for (const service of services) {
      const existingService = await db.services.get(service.id);
      if (existingService) {
        await db.services.update(service.id, {
          usageCount: Math.max(0, existingService.usageCount + delta),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  });
}

/**
 * Queues a sync operation
 *
 * @description Adds an operation to the sync queue for later synchronization
 *
 * @see Requirement 3.5 Queue up to 1000 operations
 * @see Requirement 3.6 Process in chronological order
 */
async function queueSyncOperation(
  operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>
): Promise<void> {
  // Check queue size limit
  const queueSize = await db.syncQueue.count();
  if (queueSize >= DB_CONSTANTS.MAX_SYNC_QUEUE_SIZE) {
    console.warn('Sync queue is full, operation will not be queued');
    return;
  }

  const syncOperation: SyncOperation = {
    ...operation,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    retryCount: 0,
  };

  await db.syncQueue.add(syncOperation);
}

/**
 * Replaces a temporary invoice number with a permanent one
 *
 * @description Called after sync when server assigns permanent invoice number
 *
 * @see Requirement 4.7 Replace temporary ID with permanent number
 *
 * @param tempId - The temporary invoice ID
 * @param permanentNumber - The server-assigned invoice number
 * @returns The updated invoice, or undefined if not found
 */
export async function replaceTemporaryInvoiceNumber(
  tempId: string,
  permanentNumber: string
): Promise<Invoice | undefined> {
  const invoice = await db.invoices.get(tempId);

  if (!invoice || !isTempInvoiceNumber(invoice.invoiceNumber)) {
    return undefined;
  }

  const updatedInvoice: Invoice = {
    ...invoice,
    invoiceNumber: permanentNumber,
    syncStatus: 'synced',
    updatedAt: new Date().toISOString(),
  };

  await db.invoices.put(updatedInvoice);

  return updatedInvoice;
}

/**
 * Gets all invoices with pending sync status
 *
 * @description Returns invoices that need to be synchronized
 *
 * @returns Array of invoices pending sync
 */
export async function getPendingInvoices(): Promise<Invoice[]> {
  return db.invoices.where('syncStatus').equals('pending').toArray();
}

/**
 * Marks an invoice as synced
 *
 * @description Updates the sync status after successful synchronization
 *
 * @param id - The invoice ID
 * @param serverId - Optional server-assigned ID if different
 */
export async function markInvoiceSynced(
  id: string,
  serverId?: string
): Promise<void> {
  const invoice = await db.invoices.get(id);

  if (!invoice) {
    return;
  }

  // If server assigned a different ID, we need to update
  if (serverId && serverId !== id) {
    await db.invoices.delete(id);
    await db.invoices.put({
      ...invoice,
      id: serverId,
      syncStatus: 'synced',
      updatedAt: new Date().toISOString(),
    });
  } else {
    await db.invoices.update(id, {
      syncStatus: 'synced',
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Exports all invoices for backup
 *
 * @description Returns all invoices for data export functionality
 *
 * @returns Array of all invoices
 */
export async function exportAllInvoices(): Promise<Invoice[]> {
  return db.invoices.toArray();
}

/**
 * Imports invoices from backup
 *
 * @description Bulk imports invoices from an export file
 *
 * @param invoices - Array of invoices to import
 * @param mode - Import mode: 'merge' adds new, 'replace' clears existing first
 */
export async function importInvoices(
  invoices: Invoice[],
  mode: 'merge' | 'replace' = 'merge'
): Promise<{ imported: number; skipped: number }> {
  let imported = 0;
  let skipped = 0;

  await db.transaction('rw', db.invoices, async () => {
    if (mode === 'replace') {
      await db.invoices.clear();
    }

    for (const invoice of invoices) {
      if (mode === 'merge') {
        const existing = await db.invoices.get(invoice.id);
        if (existing) {
          skipped++;
          continue;
        }
      }

      // Recalculate balance and status
      const totalAdvance = invoice.payments.reduce(
        (sum, p) => sum + p.amount,
        0
      );
      const balanceDue = calculateBalanceDue(invoice.totalAmount, totalAdvance);
      const paymentStatus = calculatePaymentStatus(
        invoice.totalAmount,
        totalAdvance
      );

      await db.invoices.put({
        ...invoice,
        advancePaid: totalAdvance,
        balanceDue,
        paymentStatus,
        syncStatus: 'pending',
      });
      imported++;
    }
  });

  return { imported, skipped };
}
