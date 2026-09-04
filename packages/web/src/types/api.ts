/**
 * CandyCapture Photography Invoice Application
 * API Response Types
 *
 * @description Type definitions for API request/response contracts
 * @requirements 3 Multi-device synchronization
 */

/**
 * Generic API response wrapper
 *
 * @description Standard response format for all API endpoints
 * @typeParam T - The data payload type
 *
 * @example
 * ```typescript
 * // Successful response
 * const successResponse: ApiResponse<Customer> = {
 *   success: true,
 *   data: { id: 'cust_123', name: 'Bala', ... }
 * };
 *
 * // Error response
 * const errorResponse: ApiResponse<Customer> = {
 *   success: false,
 *   error: {
 *     code: 'VALIDATION_ERROR',
 *     message: 'Mobile number must be 10 digits'
 *   }
 * };
 * ```
 */
export interface ApiResponse<T> {
  /**
   * Indicates whether the request was successful
   */
  success: boolean;

  /**
   * Response payload (present when success is true)
   */
  data?: T;

  /**
   * Error details (present when success is false)
   */
  error?: ApiError;
}

/**
 * API error details
 *
 * @description Structured error information for failed requests
 */
export interface ApiError {
  /**
   * Error code for programmatic handling
   * @example "VALIDATION_ERROR", "NOT_FOUND", "UNAUTHORIZED"
   */
  code: string;

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * Additional error details (optional)
   */
  details?: Record<string, unknown>;
}

/**
 * Paginated response wrapper
 *
 * @description Response format for paginated list endpoints
 * @typeParam T - The item type in the list
 *
 * @example
 * ```typescript
 * const customerList: PaginatedResponse<Customer> = {
 *   items: [{ id: 'cust_1', ... }, { id: 'cust_2', ... }],
 *   nextToken: 'eyJsYXN0S2V5IjoiY3VzdF8yIn0=',
 *   totalCount: 150
 * };
 * ```
 */
export interface PaginatedResponse<T> {
  /**
   * Array of items for the current page
   */
  items: T[];

  /**
   * Pagination token for the next page
   * @description Undefined when there are no more pages
   */
  nextToken?: string;

  /**
   * Total count of items matching the query
   */
  totalCount: number;
}

/**
 * Sync batch request
 *
 * @description Request payload for batch synchronization endpoint
 * @see Requirement 3 Multi-device synchronization
 */
export interface SyncBatchRequest {
  /**
   * Array of pending sync operations
   * @maxItems 25
   */
  operations: SyncOperationPayload[];

  /**
   * Timestamp of last successful sync
   * @format date-time
   * @description Used to fetch server changes since this time
   */
  lastSyncTimestamp: string;
}

/**
 * Sync operation payload for API request
 */
export interface SyncOperationPayload {
  /**
   * Unique operation identifier
   */
  id: string;

  /**
   * Operation type
   */
  type: 'CREATE' | 'UPDATE' | 'DELETE';

  /**
   * Entity type
   */
  entity: 'customer' | 'invoice' | 'service' | 'settings';

  /**
   * Entity ID (local ID for CREATE, server ID for UPDATE/DELETE)
   */
  entityId: string;

  /**
   * Entity data (for CREATE and UPDATE operations)
   */
  payload: unknown;

  /**
   * Client timestamp when operation was created
   * @format date-time
   */
  timestamp: string;

  /**
   * Number of retry attempts
   */
  retryCount: number;
}

/**
 * Sync batch response
 *
 * @description Response payload from batch synchronization endpoint
 * @see Requirement 3 Multi-device synchronization
 */
export interface SyncBatchResponse {
  /**
   * Results for each processed operation
   */
  processed: SyncOperationResult[];

  /**
   * Changes from server that need to be applied locally
   * @description Contains data from other devices since lastSyncTimestamp
   */
  serverChanges: ServerChange[];

  /**
   * Current server timestamp
   * @format date-time
   * @description Use as lastSyncTimestamp in next sync request
   */
  serverTimestamp: string;
}

/**
 * Result of a sync operation
 */
export interface SyncOperationResult {
  /**
   * ID of the processed operation
   */
  operationId: string;

  /**
   * Whether the operation was successful
   */
  success: boolean;

  /**
   * Error message if operation failed
   */
  error?: string;

  /**
   * Server-assigned data (e.g., permanent invoice number, server ID)
   * @description Present for CREATE operations on success
   */
  serverData?: {
    /**
     * Server-assigned entity ID
     */
    id?: string;

    /**
     * Server-assigned invoice number (for invoice creation)
     */
    invoiceNumber?: string;

    /**
     * Additional server-assigned fields
     */
    [key: string]: unknown;
  };
}

/**
 * Server change notification
 *
 * @description Represents a change from the server that needs local application
 */
export interface ServerChange {
  /**
   * Type of entity that changed
   */
  entity: 'customer' | 'invoice' | 'service' | 'settings';

  /**
   * ID of the changed entity
   */
  entityId: string;

  /**
   * Type of change
   */
  operation: 'CREATE' | 'UPDATE' | 'DELETE';

  /**
   * Entity data (undefined for DELETE operations)
   */
  data: unknown;

  /**
   * Server timestamp of the change
   * @format date-time
   */
  timestamp: string;
}

/**
 * Authentication login request
 */
export interface LoginRequest {
  /**
   * User's username (email)
   * @format email
   */
  username: string;

  /**
   * User's password
   */
  password: string;
}

/**
 * Authentication login response
 */
export interface LoginResponse {
  /**
   * JWT access token
   */
  accessToken: string;

  /**
   * JWT refresh token
   */
  refreshToken: string;

  /**
   * Token expiration time in seconds
   */
  expiresIn: number;

  /**
   * Authenticated user information
   */
  user: User;
}

/**
 * User information
 */
export interface User {
  /**
   * User identifier
   */
  id: string;

  /**
   * User's username (email)
   */
  username: string;
}

/**
 * Authentication result from AuthService
 */
export interface AuthResult {
  /**
   * Whether authentication was successful
   */
  success: boolean;

  /**
   * Authenticated user (present on success)
   */
  user?: User;

  /**
   * Error message (present on failure)
   */
  error?: string;
}

/**
 * Query options for list operations
 */
export interface QueryOptions {
  /**
   * Maximum number of items to return
   * @default 20
   */
  limit?: number;

  /**
   * Pagination token for next page
   */
  nextToken?: string;

  /**
   * Sort order
   * @default 'desc'
   */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Invoice-specific query options
 */
export interface InvoiceQueryOptions extends QueryOptions {
  /**
   * Filter by payment status
   */
  paymentStatus?: 'PENDING' | 'PARTIALLY_PAID' | 'PAID';

  /**
   * Filter by customer ID
   */
  customerId?: string;

  /**
   * Filter invoices from this date (inclusive)
   * @format date
   */
  fromDate?: string;

  /**
   * Filter invoices to this date (inclusive)
   * @format date
   */
  toDate?: string;

  /**
   * Search text for invoice number or customer name
   */
  searchText?: string;
}

/**
 * Customer-specific query options
 */
export interface CustomerQueryOptions extends QueryOptions {
  /**
   * Search text for name or mobile
   */
  searchText?: string;
}

/**
 * Data export format
 *
 * @description Complete data export for backup/restore operations
 */
export interface ExportData {
  /**
   * Export format version
   */
  version: string;

  /**
   * Export timestamp
   * @format date-time
   */
  exportedAt: string;

  /**
   * All customer records
   */
  customers: unknown[];

  /**
   * All invoice records
   */
  invoices: unknown[];

  /**
   * All service definitions
   */
  services: unknown[];

  /**
   * Settings configuration
   */
  settings: unknown;
}

/**
 * WebSocket event types
 */
export type WebSocketEventType = 'DATA_CHANGED' | 'REFRESH_REQUIRED';

/**
 * WebSocket data changed event
 *
 * @description Notification when data changes on another device
 */
export interface DataChangedEvent {
  type: 'DATA_CHANGED';
  payload: {
    entity: 'customer' | 'invoice' | 'service' | 'settings';
    entityId: string;
    operation: 'CREATE' | 'UPDATE' | 'DELETE';
    timestamp: string;
  };
}

/**
 * WebSocket refresh required event
 *
 * @description Force client to refresh all data
 */
export interface RefreshRequiredEvent {
  type: 'REFRESH_REQUIRED';
  payload: {
    reason: 'settings_changed' | 'bulk_import' | 'admin_action';
  };
}

/**
 * Union type for all WebSocket events
 */
export type WebSocketEvent = DataChangedEvent | RefreshRequiredEvent;
