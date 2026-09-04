/**
 * CandyCapture Photography Invoice Application
 * Dexie.js Database Schema
 *
 * @description IndexedDB database schema using Dexie.js for offline-first storage
 * @requirements 3.5 Offline queue support, 13.7 Local data access, 17.3 Auto-save draft
 */

import Dexie, { type Table } from 'dexie';
import type { Customer, Invoice, Service, Settings, SyncOperation } from '../types/models';

/**
 * Sync queue item for queueing offline operations
 *
 * @description Extends SyncOperation with additional tracking for queue management
 * @see Requirement 3.5 Offline queue (up to 1000 operations)
 * @see Requirement 3.6 Chronological processing on reconnection
 */
export interface SyncQueueItem extends SyncOperation {
  /**
   * Priority for processing (lower = higher priority)
   * @default 0
   */
  priority?: number;
}

/**
 * Sync metadata for tracking synchronization state
 *
 * @description Stores key-value pairs for sync state management
 * @example
 * ```typescript
 * // Last sync timestamp
 * { key: 'lastSyncTimestamp', value: '2026-09-03T10:30:00Z' }
 *
 * // Sync in progress flag
 * { key: 'syncInProgress', value: true }
 *
 * // Last successful sync timestamp
 * { key: 'lastSuccessfulSync', value: '2026-09-03T10:30:00Z' }
 * ```
 */
export interface SyncMeta {
  /**
   * Unique key identifier
   * @examples 'lastSyncTimestamp', 'syncInProgress', 'initialSyncComplete'
   */
  key: string;

  /**
   * Value associated with the key
   * Can be string, number, boolean, or Date
   */
  value: string | number | boolean | Date;

  /**
   * Timestamp when this meta was last updated
   * @format date-time
   */
  updatedAt?: string;
}

/**
 * CandyCapture Photography IndexedDB Database
 *
 * @description Main database class extending Dexie for offline-first storage.
 * Provides structured tables for customers, invoices, services, settings,
 * and synchronization queue management.
 *
 * @see Design Document - IndexedDB Schema (Dexie.js)
 * @see Requirement 3.5 Offline queue support
 * @see Requirement 13.7 Local data access when offline
 * @see Requirement 17.3 Auto-save draft functionality
 *
 * @example
 * ```typescript
 * // Import the database instance
 * import { db } from './services/db';
 *
 * // Query customers
 * const customers = await db.customers.toArray();
 *
 * // Search by name (using index)
 * const results = await db.customers
 *   .where('name')
 *   .startsWithIgnoreCase('Bala')
 *   .toArray();
 *
 * // Query invoices by date range
 * const invoices = await db.invoices
 *   .where('invoiceDate')
 *   .between('2026-01-01', '2026-12-31')
 *   .toArray();
 *
 * // Get pending sync operations
 * const pending = await db.syncQueue
 *   .orderBy('timestamp')
 *   .toArray();
 * ```
 */
export class CandyCaptureDB extends Dexie {
  /**
   * Customers table
   *
   * @description Stores customer records with contact and event information
   * @indexes id (primary), name, mobile, eventDate, syncStatus, updatedAt
   * @see Requirement 5 Customer management
   */
  customers!: Table<Customer, string>;

  /**
   * Invoices table
   *
   * @description Stores invoice records with services and payment tracking
   * @indexes id (primary), invoiceNumber, customerId, invoiceDate, paymentStatus, syncStatus, updatedAt
   * @see Requirement 1 Invoice design compliance
   * @see Requirement 7 Payment calculation and status
   */
  invoices!: Table<Invoice, string>;

  /**
   * Services table
   *
   * @description Stores configurable photography services
   * @indexes id (primary), name, displayOrder, enabled
   * @see Requirement 6 Service management
   */
  services!: Table<Service, string>;

  /**
   * Settings table
   *
   * @description Stores business information and application configuration
   * @indexes id (primary - always "settings")
   * @see Requirement 12 Settings and configuration
   */
  settings!: Table<Settings, string>;

  /**
   * Sync queue table
   *
   * @description Queues offline operations for synchronization when online
   * @indexes id (primary), entity, timestamp, retryCount
   * @see Requirement 3.5 Offline queue (up to 1000 operations)
   * @see Requirement 3.6 Chronological processing
   */
  syncQueue!: Table<SyncQueueItem, string>;

  /**
   * Sync metadata table
   *
   * @description Stores sync state information (last sync time, flags, etc.)
   * @indexes key (primary)
   */
  syncMeta!: Table<SyncMeta, string>;

  constructor() {
    super('CandyCaptureDB');

    /**
     * Database Schema Version 1
     *
     * Index Configuration:
     * - Primary key is always the first field listed
     * - Additional fields are secondary indexes for efficient queries
     * - Compound indexes use [field1+field2] syntax
     *
     * @see https://dexie.org/docs/Version/Version.stores()
     */
    this.version(1).stores({
      /**
       * Customers table indexes:
       * - id: Primary key (UUID)
       * - name: For search by customer name
       * - mobile: For search by phone number
       * - eventDate: For filtering by event date
       * - syncStatus: For filtering pending sync items
       * - updatedAt: For sync delta queries
       */
      customers: 'id, name, mobile, eventDate, syncStatus, updatedAt',

      /**
       * Invoices table indexes:
       * - id: Primary key (UUID)
       * - invoiceNumber: For lookup by invoice number (unique)
       * - customerId: For filtering invoices by customer
       * - invoiceDate: For date range queries and sorting
       * - paymentStatus: For filtering by PENDING/PARTIALLY_PAID/PAID
       * - syncStatus: For filtering pending sync items
       * - updatedAt: For sync delta queries
       */
      invoices: 'id, invoiceNumber, customerId, invoiceDate, paymentStatus, syncStatus, updatedAt',

      /**
       * Services table indexes:
       * - id: Primary key (UUID)
       * - name: For unique name enforcement (case-insensitive lookup)
       * - displayOrder: For ordered retrieval
       * - enabled: For filtering active services
       */
      services: 'id, name, displayOrder, enabled',

      /**
       * Settings table indexes:
       * - id: Primary key (always "settings" - singleton pattern)
       */
      settings: 'id',

      /**
       * Sync queue table indexes:
       * - id: Primary key (UUID)
       * - entity: For filtering by entity type
       * - timestamp: For chronological ordering (Requirement 3.6)
       * - retryCount: For identifying failed operations
       */
      syncQueue: 'id, entity, timestamp, retryCount',

      /**
       * Sync meta table indexes:
       * - key: Primary key for key-value lookup
       */
      syncMeta: 'key',
    });
  }
}

/**
 * Singleton database instance
 *
 * @description Use this exported instance throughout the application
 * to ensure consistent database access.
 *
 * @example
 * ```typescript
 * import { db } from './services/db';
 *
 * // Use in components or services
 * const customer = await db.customers.get(customerId);
 * ```
 */
export const db = new CandyCaptureDB();

/**
 * Database Constants
 */
export const DB_CONSTANTS = {
  /**
   * Maximum number of operations in sync queue
   * @see Requirement 3.5
   */
  MAX_SYNC_QUEUE_SIZE: 1000,

  /**
   * Settings singleton key
   */
  SETTINGS_ID: 'settings',

  /**
   * Sync meta keys
   */
  SYNC_META_KEYS: {
    LAST_SYNC_TIMESTAMP: 'lastSyncTimestamp',
    SYNC_IN_PROGRESS: 'syncInProgress',
    INITIAL_SYNC_COMPLETE: 'initialSyncComplete',
    LAST_SUCCESSFUL_SYNC: 'lastSuccessfulSync',
    DEVICE_ID: 'deviceId',
  },
} as const;

/**
 * Initialize database with default data
 *
 * @description Seeds the database with default services if empty.
 * Should be called on application startup.
 *
 * @returns Promise that resolves when initialization is complete
 *
 * @example
 * ```typescript
 * import { initializeDatabase } from './services/db';
 *
 * // Call during app startup
 * await initializeDatabase();
 * ```
 */
export async function initializeDatabase(): Promise<void> {
  // Check if services need to be seeded
  const servicesCount = await db.services.count();

  if (servicesCount === 0) {
    // Pre-populate with standard services (Requirement 6.2)
    const defaultServices: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>[] = [
      { name: 'Traditional Photo', defaultQuantity: 1, enabled: true, displayOrder: 1, usageCount: 0 },
      { name: 'Traditional Video', defaultQuantity: 1, enabled: true, displayOrder: 2, usageCount: 0 },
      { name: 'Candid Photo', defaultQuantity: 1, enabled: true, displayOrder: 3, usageCount: 0 },
      { name: 'Candid Video', defaultQuantity: 1, enabled: true, displayOrder: 4, usageCount: 0 },
      { name: 'Pen Drive + Hard Disk', defaultQuantity: 1, enabled: true, displayOrder: 5, usageCount: 0 },
      { name: 'Photo Frames', defaultQuantity: 1, enabled: true, displayOrder: 6, usageCount: 0 },
      { name: 'Teaser', defaultQuantity: 1, enabled: true, displayOrder: 7, usageCount: 0 },
      { name: 'E-Invite', defaultQuantity: 1, enabled: true, displayOrder: 8, usageCount: 0 },
      { name: 'Traditional Film', defaultQuantity: 1, enabled: true, displayOrder: 9, usageCount: 0 },
      { name: 'Post-Wedding', defaultQuantity: 1, enabled: true, displayOrder: 10, usageCount: 0 },
      { name: 'Pre-Wedding', defaultQuantity: 1, enabled: true, displayOrder: 11, usageCount: 0 },
      { name: 'Album', defaultQuantity: 1, enabled: true, displayOrder: 12, usageCount: 0 },
    ];

    const now = new Date().toISOString();
    const services: Service[] = defaultServices.map((service, index) => ({
      ...service,
      id: `svc_default_${String(index + 1).padStart(3, '0')}`,
      createdAt: now,
      updatedAt: now,
    }));

    await db.services.bulkAdd(services);
  }

  // Initialize sync meta if not present
  const deviceId = await db.syncMeta.get(DB_CONSTANTS.SYNC_META_KEYS.DEVICE_ID);
  if (!deviceId) {
    await db.syncMeta.put({
      key: DB_CONSTANTS.SYNC_META_KEYS.DEVICE_ID,
      value: crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Clear all local data
 *
 * @description Removes all data from all tables. Use with caution.
 * Typically used for logout or data reset scenarios.
 *
 * @returns Promise that resolves when all data is cleared
 *
 * @example
 * ```typescript
 * import { clearAllData } from './services/db';
 *
 * // Clear on logout
 * await clearAllData();
 * ```
 */
export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.customers, db.invoices, db.services, db.settings, db.syncQueue, db.syncMeta], async () => {
    await db.customers.clear();
    await db.invoices.clear();
    await db.services.clear();
    await db.settings.clear();
    await db.syncQueue.clear();
    await db.syncMeta.clear();
  });
}

/**
 * Get database statistics
 *
 * @description Returns counts for all tables. Useful for debugging
 * and dashboard metrics.
 *
 * @returns Object with counts for each table
 *
 * @example
 * ```typescript
 * const stats = await getDatabaseStats();
 * console.log(stats.customers); // Number of customers
 * console.log(stats.invoices); // Number of invoices
 * ```
 */
export async function getDatabaseStats(): Promise<{
  customers: number;
  invoices: number;
  services: number;
  pendingSync: number;
}> {
  const [customers, invoices, services, pendingSync] = await Promise.all([
    db.customers.count(),
    db.invoices.count(),
    db.services.count(),
    db.syncQueue.count(),
  ]);

  return { customers, invoices, services, pendingSync };
}
