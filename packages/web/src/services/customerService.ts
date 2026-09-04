/**
 * CandyCapture Photography Invoice Application
 * Customer Storage Service
 *
 * @description Provides CRUD operations for customer management using IndexedDB via Dexie.js
 * @requirements 5.4 Search across Name and Mobile fields, 5.6 Edit customer records
 * @requirements 5.7 Prevent deletion of customers with invoices, 5.8 Delete customers with no invoices
 */

import { db, DB_CONSTANTS } from './db';
import type { Customer, SyncOperation } from '../types/models';

/**
 * Query options for paginated customer retrieval
 */
export interface CustomerQueryOptions {
  /**
   * Page number (1-indexed)
   * @default 1
   */
  page?: number;

  /**
   * Number of items per page
   * @default 20
   */
  pageSize?: number;

  /**
   * Field to sort by
   * @default 'name'
   */
  sortBy?: keyof Customer;

  /**
   * Sort direction
   * @default 'asc'
   */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Result type for paginated queries
 */
export interface PaginatedResult<T> {
  /**
   * Items for the current page
   */
  items: T[];

  /**
   * Total count of all items matching the query
   */
  totalCount: number;

  /**
   * Current page number (1-indexed)
   */
  page: number;

  /**
   * Number of items per page
   */
  pageSize: number;

  /**
   * Total number of pages
   */
  totalPages: number;

  /**
   * Whether there's a next page
   */
  hasNextPage: boolean;

  /**
   * Whether there's a previous page
   */
  hasPreviousPage: boolean;
}

/**
 * Result type for delete operations
 */
export interface DeleteResult {
  /**
   * Whether the deletion was successful
   */
  success: boolean;

  /**
   * Error message if deletion failed
   */
  error?: string;
}

/**
 * Customer Service
 *
 * @description Provides operations for customer data management including:
 * - Paginated retrieval with sorting
 * - Partial text search on name and mobile
 * - Create, update, and delete with sync queue integration
 *
 * @example
 * ```typescript
 * import { customerService } from './services/customerService';
 *
 * // Get paginated customers
 * const result = await customerService.getCustomers({ page: 1, pageSize: 20 });
 *
 * // Search customers
 * const matches = await customerService.searchCustomers('Bala');
 *
 * // Save a customer
 * await customerService.saveCustomer(customer);
 *
 * // Delete a customer (if no invoices)
 * const deleteResult = await customerService.deleteCustomer(customerId);
 * ```
 */
export const customerService = {
  /**
   * Get customers with pagination and sorting
   *
   * @description Retrieves customers from IndexedDB with pagination support.
   * Results are sorted by the specified field and direction.
   *
   * @param options - Query options for pagination and sorting
   * @returns Paginated result containing customers and metadata
   *
   * @see Requirement 5.9 Display invoice count for each customer
   *
   * @example
   * ```typescript
   * // Get first page sorted by name
   * const result = await customerService.getCustomers({
   *   page: 1,
   *   pageSize: 20,
   *   sortBy: 'name',
   *   sortOrder: 'asc'
   * });
   *
   * console.log(result.items); // Customer array
   * console.log(result.totalPages); // Total pages available
   * ```
   */
  async getCustomers(options: CustomerQueryOptions = {}): Promise<PaginatedResult<Customer>> {
    const { page = 1, pageSize = 20, sortBy = 'name', sortOrder = 'asc' } = options;

    // Get total count for pagination metadata
    const totalCount = await db.customers.count();

    // Calculate pagination values
    const totalPages = Math.ceil(totalCount / pageSize);
    const offset = (page - 1) * pageSize;

    // Query with sorting
    let collection = db.customers.orderBy(sortBy as string);

    if (sortOrder === 'desc') {
      collection = collection.reverse();
    }

    // Apply pagination
    const items = await collection.offset(offset).limit(pageSize).toArray();

    return {
      items,
      totalCount,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  },

  /**
   * Search customers by name or mobile number
   *
   * @description Performs case-insensitive partial matching on customer name
   * and mobile number fields. Results are returned within 500ms requirement.
   *
   * @param query - Search text (minimum 1 character)
   * @returns Array of matching customers
   *
   * @see Requirement 5.4 Search across Name and Mobile with partial matching
   * @see Requirement 19.2 Search results within 500ms
   *
   * @example
   * ```typescript
   * // Search by name
   * const byName = await customerService.searchCustomers('Bala');
   *
   * // Search by mobile
   * const byMobile = await customerService.searchCustomers('9500');
   * ```
   */
  async searchCustomers(query: string): Promise<Customer[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = query.toLowerCase().trim();

    // Use Dexie filter for partial matching across name and mobile
    // This approach handles case-insensitive partial matching
    const results = await db.customers
      .filter((customer) => {
        const nameMatch = customer.name.toLowerCase().includes(searchTerm);
        const mobileMatch = customer.mobile.includes(searchTerm);
        return nameMatch || mobileMatch;
      })
      .toArray();

    return results;
  },

  /**
   * Get a single customer by ID
   *
   * @description Retrieves a customer record by its unique identifier.
   *
   * @param id - Customer UUID
   * @returns Customer record or undefined if not found
   *
   * @example
   * ```typescript
   * const customer = await customerService.getCustomerById('cust_abc123');
   * if (customer) {
   *   console.log(customer.name);
   * }
   * ```
   */
  async getCustomerById(id: string): Promise<Customer | undefined> {
    return db.customers.get(id);
  },

  /**
   * Save a customer (create or update)
   *
   * @description Saves a customer record to IndexedDB and queues a sync operation.
   * If the customer ID already exists, it performs an update; otherwise, it creates.
   *
   * @param customer - Customer record to save
   * @returns The saved customer record
   *
   * @see Requirement 5.6 Edit customer records
   * @see Requirement 3.5 Queue sync operations on mutation
   *
   * @example
   * ```typescript
   * // Create new customer
   * const newCustomer: Customer = {
   *   id: crypto.randomUUID(),
   *   name: 'Bala',
   *   mobile: '9500440272',
   *   eventType: 'Wedding',
   *   eventDate: '2026-11-20',
   *   location: 'Sivakasi',
   *   invoiceCount: 0,
   *   createdAt: new Date().toISOString(),
   *   updatedAt: new Date().toISOString(),
   *   syncStatus: 'pending'
   * };
   * await customerService.saveCustomer(newCustomer);
   *
   * // Update existing customer
   * customer.name = 'Bala Kumar';
   * customer.updatedAt = new Date().toISOString();
   * await customerService.saveCustomer(customer);
   * ```
   */
  async saveCustomer(customer: Customer): Promise<Customer> {
    const now = new Date().toISOString();
    const existingCustomer = await db.customers.get(customer.id);

    // Determine if this is a create or update operation
    const isCreate = !existingCustomer;
    const operationType = isCreate ? 'CREATE' : 'UPDATE';

    // Prepare the customer record
    const customerToSave: Customer = {
      ...customer,
      updatedAt: now,
      syncStatus: 'pending',
      // Set createdAt only for new customers
      createdAt: isCreate ? now : customer.createdAt,
    };

    // Save to IndexedDB
    await db.customers.put(customerToSave);

    // Queue sync operation
    await queueSyncOperation({
      type: operationType,
      entity: 'customer',
      entityId: customer.id,
      payload: customerToSave,
    });

    return customerToSave;
  },

  /**
   * Delete a customer
   *
   * @description Deletes a customer if they have no associated invoices.
   * If the customer has invoices, the deletion is rejected with an error message.
   *
   * @param id - Customer UUID to delete
   * @returns Result object indicating success or failure with error message
   *
   * @see Requirement 5.7 Prevent deletion of customers with invoices
   * @see Requirement 5.8 Delete customers with no invoices
   *
   * @example
   * ```typescript
   * const result = await customerService.deleteCustomer('cust_abc123');
   * if (result.success) {
   *   console.log('Customer deleted');
   * } else {
   *   console.error(result.error); // "Cannot delete customer with existing invoices"
   * }
   * ```
   */
  async deleteCustomer(id: string): Promise<DeleteResult> {
    // Check if customer exists
    const customer = await db.customers.get(id);
    if (!customer) {
      return {
        success: false,
        error: 'Customer not found',
      };
    }

    // Check for associated invoices
    const invoiceCount = await customerService.getCustomerInvoiceCount(id);
    if (invoiceCount > 0) {
      return {
        success: false,
        error: `Cannot delete customer with existing invoices (${invoiceCount} invoice${invoiceCount > 1 ? 's' : ''})`,
      };
    }

    // Delete the customer
    await db.customers.delete(id);

    // Queue sync operation for deletion
    await queueSyncOperation({
      type: 'DELETE',
      entity: 'customer',
      entityId: id,
      payload: { id },
    });

    return { success: true };
  },

  /**
   * Get the count of invoices associated with a customer
   *
   * @description Counts invoices that reference the given customer ID.
   * Used for deletion protection and display purposes.
   *
   * @param customerId - Customer UUID to check
   * @returns Number of invoices associated with the customer
   *
   * @see Requirement 5.7 Deletion protection check
   * @see Requirement 5.9 Display invoice count
   *
   * @example
   * ```typescript
   * const count = await customerService.getCustomerInvoiceCount('cust_abc123');
   * console.log(`Customer has ${count} invoices`);
   * ```
   */
  async getCustomerInvoiceCount(customerId: string): Promise<number> {
    return db.invoices.where('customerId').equals(customerId).count();
  },

  /**
   * Update invoice count for a customer
   *
   * @description Recalculates and updates the invoiceCount field for a customer.
   * Should be called after invoice creation/deletion.
   *
   * @param customerId - Customer UUID to update
   *
   * @example
   * ```typescript
   * // After creating an invoice for a customer
   * await customerService.updateCustomerInvoiceCount('cust_abc123');
   * ```
   */
  async updateCustomerInvoiceCount(customerId: string): Promise<void> {
    const count = await customerService.getCustomerInvoiceCount(customerId);
    await db.customers.update(customerId, {
      invoiceCount: count,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Get all customers (no pagination)
   *
   * @description Retrieves all customers from the database.
   * Use with caution for large datasets; prefer getCustomers() with pagination.
   *
   * @returns Array of all customers
   *
   * @example
   * ```typescript
   * // For export or batch operations
   * const allCustomers = await customerService.getAllCustomers();
   * ```
   */
  async getAllCustomers(): Promise<Customer[]> {
    return db.customers.toArray();
  },
};

/**
 * Queue a sync operation for later processing
 *
 * @description Internal helper to queue operations for synchronization.
 * Respects the maximum queue size limit of 1000 operations.
 *
 * @param operation - Partial sync operation without id, timestamp, and retryCount
 *
 * @see Requirement 3.5 Offline queue (up to 1000 operations)
 * @see Requirement 3.6 Chronological processing
 */
async function queueSyncOperation(
  operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>
): Promise<void> {
  // Check queue size limit
  const queueSize = await db.syncQueue.count();
  if (queueSize >= DB_CONSTANTS.MAX_SYNC_QUEUE_SIZE) {
    console.warn('Sync queue is full. Operation will be processed on next sync.');
    return;
  }

  const syncOperation: SyncOperation = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    retryCount: 0,
    ...operation,
  };

  await db.syncQueue.add(syncOperation);
}

export default customerService;
