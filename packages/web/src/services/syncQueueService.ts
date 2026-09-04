/**
 * CandyCapture Photography Invoice Application
 * Sync Queue Management Service
 *
 * @description Manages the offline sync queue for CREATE/UPDATE/DELETE operations.
 * Handles queueing, retrieval, and removal of sync operations with a 1000 operation limit.
 *
 * @requirements 3.5 Offline queue (up to 1000 operations)
 * @requirements 3.6 Chronological processing on reconnection
 */

import { db, DB_CONSTANTS, type SyncQueueItem } from './db';
import type { SyncEntityType, SyncOperationType } from '../types/enums';

/**
 * Input for queueing a new sync operation
 */
export interface QueueOperationInput {
  /**
   * Type of operation: CREATE, UPDATE, or DELETE
   */
  type: SyncOperationType;

  /**
   * Entity type being operated on
   */
  entity: SyncEntityType;

  /**
   * ID of the entity being operated on
   */
  entityId: string;

  /**
   * Operation payload (entity data for CREATE/UPDATE)
   * @optional for DELETE operations
   */
  data?: unknown;
}

/**
 * Result of a queue operation attempt
 */
export interface QueueOperationResult {
  /**
   * Whether the operation was successfully queued
   */
  success: boolean;

  /**
   * ID of the queued operation (if successful)
   */
  operationId?: string;

  /**
   * Error message if the operation failed
   */
  error?: string;
}

/**
 * Queue a new sync operation
 *
 * @description Adds a CREATE, UPDATE, or DELETE operation to the sync queue.
 * Generates a UUID for the operation, sets timestamp to current ISO string,
 * and initializes retryCount to 0.
 *
 * @param operation - The operation to queue
 * @returns Result indicating success or failure with operation ID
 *
 * @throws Rejects if the queue is full (1000 operations limit)
 *
 * @see Requirement 3.5 Queue up to 1000 operations
 *
 * @example
 * ```typescript
 * const result = await queueOperation({
 *   type: 'CREATE',
 *   entity: 'customer',
 *   entityId: 'cust_abc123',
 *   data: { name: 'Bala', mobile: '9500440272' }
 * });
 *
 * if (result.success) {
 *   console.log('Queued operation:', result.operationId);
 * } else {
 *   console.error('Failed to queue:', result.error);
 * }
 * ```
 */
export async function queueOperation(operation: QueueOperationInput): Promise<QueueOperationResult> {
  // Check if queue is full before adding
  const currentSize = await db.syncQueue.count();

  if (currentSize >= DB_CONSTANTS.MAX_SYNC_QUEUE_SIZE) {
    return {
      success: false,
      error: `Sync queue is full. Maximum ${DB_CONSTANTS.MAX_SYNC_QUEUE_SIZE} operations allowed. Please wait for sync to complete.`,
    };
  }

  const operationId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const syncQueueItem: SyncQueueItem = {
    id: operationId,
    type: operation.type,
    entity: operation.entity,
    entityId: operation.entityId,
    payload: operation.data,
    timestamp,
    retryCount: 0,
    priority: 0,
  };

  try {
    await db.syncQueue.add(syncQueueItem);

    return {
      success: true,
      operationId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to queue operation',
    };
  }
}

/**
 * Get pending operations sorted by timestamp
 *
 * @description Retrieves operations from the sync queue sorted by timestamp
 * in ascending order (oldest first) for chronological processing.
 *
 * @param limit - Optional maximum number of operations to return
 * @returns Array of sync queue items sorted by timestamp ASC
 *
 * @see Requirement 3.6 Process queued operations in chronological order
 *
 * @example
 * ```typescript
 * // Get all pending operations
 * const allPending = await getPendingOperations();
 *
 * // Get first 25 for batch processing
 * const batch = await getPendingOperations(25);
 * ```
 */
export async function getPendingOperations(limit?: number): Promise<SyncQueueItem[]> {
  const query = db.syncQueue.orderBy('timestamp');

  if (limit !== undefined && limit > 0) {
    return query.limit(limit).toArray();
  }

  return query.toArray();
}

/**
 * Get operations filtered by entity type
 *
 * @description Retrieves all queued operations for a specific entity type,
 * sorted by timestamp in ascending order.
 *
 * @param entity - The entity type to filter by
 * @returns Array of sync queue items for the specified entity
 *
 * @example
 * ```typescript
 * // Get all pending customer operations
 * const customerOps = await getOperationsByEntity('customer');
 *
 * // Get all pending invoice operations
 * const invoiceOps = await getOperationsByEntity('invoice');
 * ```
 */
export async function getOperationsByEntity(entity: SyncEntityType): Promise<SyncQueueItem[]> {
  return db.syncQueue.where('entity').equals(entity).sortBy('timestamp');
}

/**
 * Remove an operation from the queue after successful sync
 *
 * @description Deletes a single operation from the sync queue.
 * Typically called after the operation has been successfully synced to the server.
 *
 * @param operationId - The unique ID of the operation to remove
 *
 * @see Requirement 3.6 Remove operations after successful sync
 *
 * @example
 * ```typescript
 * // After successful sync
 * await removeOperation('op_abc123');
 * ```
 */
export async function removeOperation(operationId: string): Promise<void> {
  await db.syncQueue.delete(operationId);
}

/**
 * Remove multiple operations from the queue (bulk delete)
 *
 * @description Deletes multiple operations from the sync queue in a single transaction.
 * More efficient than calling removeOperation multiple times.
 *
 * @param operationIds - Array of operation IDs to remove
 *
 * @example
 * ```typescript
 * // After successful batch sync
 * await removeOperations(['op_001', 'op_002', 'op_003']);
 * ```
 */
export async function removeOperations(operationIds: string[]): Promise<void> {
  if (operationIds.length === 0) {
    return;
  }

  await db.syncQueue.bulkDelete(operationIds);
}

/**
 * Update the retry count for a failed operation
 *
 * @description Increments the retry count for an operation that failed to sync.
 * Also updates the lastError field with the error message if provided.
 *
 * @param operationId - The ID of the operation to update
 * @param errorMessage - Optional error message from the failed sync attempt
 *
 * @see Requirement 3.10 Retry with exponential backoff (max 10 retries)
 *
 * @example
 * ```typescript
 * // After sync failure
 * await updateRetryCount('op_abc123', 'Network timeout');
 * ```
 */
export async function updateRetryCount(operationId: string, errorMessage?: string): Promise<void> {
  const operation = await db.syncQueue.get(operationId);

  if (!operation) {
    return;
  }

  const updates: Partial<SyncQueueItem> = {
    retryCount: operation.retryCount + 1,
  };

  if (errorMessage) {
    updates.lastError = errorMessage;
  }

  await db.syncQueue.update(operationId, updates);
}

/**
 * Get the current size of the sync queue
 *
 * @description Returns the count of operations currently in the sync queue.
 *
 * @returns Number of pending operations in the queue
 *
 * @example
 * ```typescript
 * const size = await getQueueSize();
 * console.log(`${size} operations pending sync`);
 * ```
 */
export async function getQueueSize(): Promise<number> {
  return db.syncQueue.count();
}

/**
 * Clear all operations from the sync queue
 *
 * @description Removes all operations from the sync queue.
 * Use with caution - typically only for testing or manual reset scenarios.
 *
 * @example
 * ```typescript
 * // Clear queue for testing
 * await clearQueue();
 * ```
 */
export async function clearQueue(): Promise<void> {
  await db.syncQueue.clear();
}

/**
 * Check if the sync queue is full
 *
 * @description Helper function to check if the queue has reached
 * its 1000 operation limit.
 *
 * @returns true if the queue is at capacity, false otherwise
 *
 * @see Requirement 3.5 Limit queue to 1000 operations
 *
 * @example
 * ```typescript
 * if (await isQueueFull()) {
 *   console.warn('Sync queue is full, please wait for sync');
 * }
 * ```
 */
export async function isQueueFull(): Promise<boolean> {
  const currentSize = await db.syncQueue.count();
  return currentSize >= DB_CONSTANTS.MAX_SYNC_QUEUE_SIZE;
}

/**
 * Get operations that have exceeded the maximum retry count
 *
 * @description Retrieves operations that have failed more than the allowed
 * number of retry attempts (default 10).
 *
 * @param maxRetries - Maximum retry count threshold (default: 10)
 * @returns Array of failed operations
 *
 * @see Requirement 3.10 Maximum 10 retry attempts
 *
 * @example
 * ```typescript
 * const failedOps = await getFailedOperations();
 * if (failedOps.length > 0) {
 *   console.error(`${failedOps.length} operations failed permanently`);
 * }
 * ```
 */
export async function getFailedOperations(maxRetries: number = 10): Promise<SyncQueueItem[]> {
  return db.syncQueue.where('retryCount').above(maxRetries).toArray();
}

/**
 * Get a single operation by ID
 *
 * @description Retrieves a specific operation from the queue by its ID.
 *
 * @param operationId - The unique ID of the operation
 * @returns The sync queue item or undefined if not found
 *
 * @example
 * ```typescript
 * const op = await getOperationById('op_abc123');
 * if (op) {
 *   console.log(`Operation type: ${op.type}`);
 * }
 * ```
 */
export async function getOperationById(operationId: string): Promise<SyncQueueItem | undefined> {
  return db.syncQueue.get(operationId);
}
