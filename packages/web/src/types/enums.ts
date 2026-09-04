/**
 * CandyCapture Photography Invoice Application
 * Enums and Type Unions
 *
 * @description Type definitions for status values and enumerated types
 * @requirements 7.1-7.4 Payment calculation and status tracking
 */

/**
 * Payment status for an invoice
 *
 * @description Tracks the payment state of an invoice based on advance payments
 * - PENDING: No advance payment received (advancePaid === 0)
 * - PARTIALLY_PAID: Partial advance received (advancePaid > 0 && advancePaid < totalAmount)
 * - PAID: Full payment received (advancePaid >= totalAmount)
 *
 * @see Requirement 7.2-7.4 Payment status determination rules
 */
export type PaymentStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID';

/**
 * Enum version of PaymentStatus for use cases requiring enum behavior
 */
export const PaymentStatusEnum = {
  PENDING: 'PENDING',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
} as const;

/**
 * Synchronization status for local data
 *
 * @description Tracks whether local data is synchronized with the cloud backend
 * - synced: Data is synchronized with the server
 * - pending: Local changes waiting to be synced
 * - error: Sync failed and requires attention
 *
 * @see Requirement 3 Multi-device synchronization
 */
export type SyncStatus = 'synced' | 'pending' | 'error';

/**
 * Enum version of SyncStatus for use cases requiring enum behavior
 */
export const SyncStatusEnum = {
  SYNCED: 'synced',
  PENDING: 'pending',
  ERROR: 'error',
} as const;

/**
 * Synchronization connection status
 *
 * @description Current state of the sync engine connection
 * - online: Connected and ready to sync
 * - offline: No network connection
 * - syncing: Actively synchronizing data
 * - error: Connection or sync error occurred
 */
export type SyncConnectionStatus = 'online' | 'offline' | 'syncing' | 'error';

/**
 * Sync operation types
 *
 * @description Types of operations that can be queued for synchronization
 */
export type SyncOperationType = 'CREATE' | 'UPDATE' | 'DELETE';

/**
 * Entity types that can be synchronized
 *
 * @description Database entities that support synchronization
 */
export type SyncEntityType = 'customer' | 'invoice' | 'service' | 'settings';
