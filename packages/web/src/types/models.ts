/**
 * CandyCapture Photography Invoice Application
 * Domain Model Interfaces
 *
 * @description Core data model interfaces for customers, invoices, services, and settings
 * @requirements 5.1 Customer management, 6.1 Service management, 7.1-7.4 Payment tracking
 */

import type { PaymentStatus, SyncStatus } from './enums';

/**
 * Customer entity
 *
 * @description Represents a customer record with contact and event information
 * @see Requirement 5.1 Customer field requirements
 *
 * @example
 * ```typescript
 * const customer: Customer = {
 *   id: 'cust_abc123',
 *   name: 'Bala',
 *   mobile: '9500440272',
 *   eventType: 'Wedding',
 *   eventDate: '2026-11-20',
 *   location: 'Sivakasi',
 *   invoiceCount: 1,
 *   createdAt: '2026-09-01T10:00:00Z',
 *   updatedAt: '2026-09-01T10:00:00Z',
 *   syncStatus: 'synced'
 * };
 * ```
 */
export interface Customer {
  /**
   * Unique identifier (UUID)
   * @format uuid
   */
  id: string;

  /**
   * Customer's full name
   * @maxLength 100
   * @required
   */
  name: string;

  /**
   * Indian mobile phone number
   * @pattern ^\d{10}$
   * @required
   * @example "9500440272"
   */
  mobile: string;

  /**
   * Email address
   * @maxLength 254
   * @format email
   * @optional
   */
  email?: string;

  /**
   * Customer's address
   * @maxLength 500
   * @optional
   */
  address?: string;

  /**
   * Type of event (e.g., Wedding, Birthday, Corporate)
   * @maxLength 100
   * @required
   */
  eventType: string;

  /**
   * Event date in ISO 8601 format
   * @format date (YYYY-MM-DD)
   * @required
   */
  eventDate: string;

  /**
   * Event location/venue
   * @maxLength 200
   * @required
   */
  location: string;

  /**
   * Additional notes about the customer
   * @maxLength 1000
   * @optional
   */
  notes?: string;

  /**
   * Number of invoices associated with this customer
   * Computed field - read only
   * @minimum 0
   */
  invoiceCount: number;

  /**
   * Record creation timestamp in ISO 8601 format
   * @format date-time
   */
  createdAt: string;

  /**
   * Last update timestamp in ISO 8601 format
   * @format date-time
   */
  updatedAt: string;

  /**
   * Local synchronization state
   */
  syncStatus: SyncStatus;
}

/**
 * Service item on an invoice
 *
 * @description Represents a selected service with quantity for an invoice.
 * Contains a snapshot of service name at time of invoice creation.
 */
export interface InvoiceService {
  /**
   * Reference to the Service entity ID
   * @format uuid
   */
  id: string;

  /**
   * Service name (snapshot at time of invoice creation)
   * @maxLength 100
   */
  name: string;

  /**
   * Quantity of service units
   * @minimum 1
   * @maximum 9999
   */
  quantity: number;
}

/**
 * Payment record
 *
 * @description Represents an advance payment made towards an invoice
 * @see Requirement 7.9 Support for multiple advance payments
 */
export interface Payment {
  /**
   * Unique payment identifier
   * @format uuid
   */
  id: string;

  /**
   * Payment amount in INR
   * @minimum 0.01
   * @maximum 99999999.99
   * @description Amount must be between ₹0.01 and the remaining balance due
   */
  amount: number;

  /**
   * Date payment was made in ISO 8601 format
   * @format date (YYYY-MM-DD)
   * @description Must be between invoice creation date and current date
   */
  paymentDate: string;

  /**
   * Timestamp when payment was recorded
   * @format date-time
   */
  createdAt: string;
}

/**
 * Invoice entity
 *
 * @description Represents a photography service invoice with payment tracking
 * @see Requirement 1 Invoice design compliance
 * @see Requirement 2 Service table structure
 * @see Requirement 7 Payment calculation and status
 *
 * @example
 * ```typescript
 * const invoice: Invoice = {
 *   id: 'inv_xyz789',
 *   invoiceNumber: 'CC-1001',
 *   customerId: 'cust_abc123',
 *   invoiceDate: '2026-09-03',
 *   dueDate: '2026-09-18',
 *   services: [
 *     { id: 'svc_001', name: 'Traditional Photo', quantity: 1 },
 *     { id: 'svc_002', name: 'Traditional Video', quantity: 1 }
 *   ],
 *   totalAmount: 120000.00,
 *   advancePaid: 20000.00,
 *   balanceDue: 100000.00,
 *   paymentStatus: 'PARTIALLY_PAID',
 *   payments: [
 *     { id: 'pay_001', amount: 20000.00, paymentDate: '2026-09-03', createdAt: '2026-09-03T10:30:00Z' }
 *   ],
 *   createdAt: '2026-09-03T10:30:00Z',
 *   updatedAt: '2026-09-03T10:30:00Z',
 *   syncStatus: 'synced'
 * };
 * ```
 */
export interface Invoice {
  /**
   * Unique identifier (UUID for local, server ID after sync)
   * @format uuid
   */
  id: string;

  /**
   * Invoice number in format "{prefix}NNNN" or "TEMP-NNNN" for offline
   * @pattern ^(CC-|[A-Z0-9-]{1,10})\d{4}$|^TEMP-\d{4}$
   * @example "CC-1001", "TEMP-0001"
   * @see Requirement 4 Unique invoice number generation
   */
  invoiceNumber: string;

  /**
   * Reference to Customer entity
   * @format uuid
   */
  customerId: string;

  /**
   * Invoice issue date in ISO 8601 format
   * @format date (YYYY-MM-DD)
   */
  invoiceDate: string;

  /**
   * Payment due date in ISO 8601 format
   * @format date (YYYY-MM-DD)
   * @description Default is 15 days from invoice date
   */
  dueDate: string;

  /**
   * Array of selected services with quantities
   * @minItems 1
   * @maxItems 50
   * @see Requirement 2 Service table structure
   */
  services: InvoiceService[];

  /**
   * Total package amount in INR
   * @minimum 0.01
   * @maximum 99999999.99
   * @description Single total for all services (no per-service pricing)
   * @see Requirement 2.3 Single total amount input
   */
  totalAmount: number;

  /**
   * Sum of all advance payments in INR
   * @minimum 0
   * @maximum 99999999.99
   * @description Computed from sum of all payments
   */
  advancePaid: number;

  /**
   * Remaining balance in INR
   * @minimum 0
   * @description Computed: totalAmount - advancePaid
   * @see Requirement 7.1 Balance calculation
   */
  balanceDue: number;

  /**
   * Current payment status
   * @see Requirement 7.2-7.4 Payment status determination
   */
  paymentStatus: PaymentStatus;

  /**
   * History of advance payments
   * @maxItems 50
   * @see Requirement 7.9 Support for multiple payments
   */
  payments: Payment[];

  /**
   * Invoice notes/terms and conditions
   * @maxLength 2000
   * @optional
   */
  notes?: string;

  /**
   * Record creation timestamp in ISO 8601 format
   * @format date-time
   */
  createdAt: string;

  /**
   * Last update timestamp in ISO 8601 format
   * @format date-time
   */
  updatedAt: string;

  /**
   * Local synchronization state
   */
  syncStatus: SyncStatus;
}

/**
 * Photography service definition
 *
 * @description Represents a configurable photography service that can be selected for invoices
 * @see Requirement 6 Service management
 *
 * @example
 * ```typescript
 * const service: Service = {
 *   id: 'svc_001',
 *   name: 'Traditional Photo',
 *   defaultQuantity: 1,
 *   enabled: true,
 *   displayOrder: 1,
 *   usageCount: 42,
 *   createdAt: '2026-01-01T00:00:00Z',
 *   updatedAt: '2026-01-01T00:00:00Z'
 * };
 * ```
 */
export interface Service {
  /**
   * Unique service identifier
   * @format uuid
   */
  id: string;

  /**
   * Service name (must be unique, case-insensitive)
   * @minLength 1
   * @maxLength 100
   * @see Requirement 6.5 Unique service names
   */
  name: string;

  /**
   * Default quantity when service is selected
   * @minimum 1
   * @maximum 999
   * @default 1
   */
  defaultQuantity: number;

  /**
   * Whether service is available for selection
   * @default true
   * @see Requirement 6.7 Enable/disable services
   */
  enabled: boolean;

  /**
   * Order in the selection list
   * @minimum 1
   * @see Requirement 6.10 Service reordering
   */
  displayOrder: number;

  /**
   * Number of invoices using this service
   * @minimum 0
   * @description Used for deletion protection
   * @see Requirement 6.8-6.9 Service deletion rules
   */
  usageCount: number;

  /**
   * Record creation timestamp in ISO 8601 format
   * @format date-time
   */
  createdAt: string;

  /**
   * Last update timestamp in ISO 8601 format
   * @format date-time
   */
  updatedAt: string;
}

/**
 * Application settings
 *
 * @description Business information, bank details, and configuration settings
 * @see Requirement 12 Settings and configuration
 *
 * @example
 * ```typescript
 * const settings: Settings = {
 *   id: 'settings',
 *   businessName: 'CandyCapture Photography',
 *   address: 'No. 12, Parasakthi Nagar, Sivakasi',
 *   phone: '9500440272',
 *   email: 'candycapture@gmail.com',
 *   instagramHandle: 'candycapturephotography',
 *   bankAccountName: 'CandyCapture Photography',
 *   bankName: 'ICICI Bank',
 *   bankAccountNumber: '123456789012',
 *   ifscCode: 'ICIC0001234',
 *   upiId: 'candycapture@upi',
 *   invoicePrefix: 'CC-',
 *   defaultNotes: '50% advance required to confirm the booking.',
 *   defaultDueDays: 15,
 *   updatedAt: '2026-01-01T00:00:00Z'
 * };
 * ```
 */
export interface Settings {
  /**
   * Settings identifier (always "settings")
   * @const "settings"
   */
  id: string;

  /**
   * Studio/business name
   * @maxLength 100
   * @see Requirement 12.1 Business information
   */
  businessName: string;

  /**
   * Business address
   * @maxLength 500
   */
  address: string;

  /**
   * Business phone number (10-digit Indian mobile)
   * @pattern ^\d{10}$
   * @example "9500440272"
   */
  phone: string;

  /**
   * Business email address
   * @maxLength 254
   * @format email
   */
  email: string;

  /**
   * Instagram handle (without @)
   * @maxLength 30
   * @pattern ^[a-zA-Z0-9_]+$
   */
  instagramHandle: string;

  /**
   * Logo image URL (S3 storage)
   * @format uri
   * @optional
   * @see Requirement 12.2 Logo upload
   */
  logoUrl?: string;

  /**
   * Bank account holder name
   * @maxLength 100
   * @see Requirement 12.4 Bank details
   */
  bankAccountName: string;

  /**
   * Bank name
   * @maxLength 100
   */
  bankName: string;

  /**
   * Bank account number
   * @pattern ^\d{9,18}$
   * @description 9-18 digit account number
   */
  bankAccountNumber: string;

  /**
   * IFSC code
   * @pattern ^[A-Z]{4}0[A-Z0-9]{6}$
   * @description 4 letters + 0 + 6 alphanumeric characters
   * @example "ICIC0001234"
   */
  ifscCode: string;

  /**
   * UPI ID for payments
   * @maxLength 50
   * @pattern ^[\w.-]+@[\w.-]+$
   * @example "candycapture@upi"
   */
  upiId: string;

  /**
   * Invoice number prefix
   * @minLength 1
   * @maxLength 10
   * @pattern ^[A-Za-z0-9-]+$
   * @default "CC-"
   * @see Requirement 4.9 Configurable prefix
   */
  invoicePrefix: string;

  /**
   * Default notes/terms for new invoices
   * @maxLength 2000
   * @see Requirement 12.7 Default notes
   */
  defaultNotes: string;

  /**
   * Default due date offset in days
   * @minimum 0
   * @maximum 365
   * @default 15
   * @see Requirement 12.8 Default due date offset
   */
  defaultDueDays: number;

  /**
   * Last update timestamp in ISO 8601 format
   * @format date-time
   */
  updatedAt: string;
}

/**
 * Sync operation for offline queue
 *
 * @description Represents a queued operation waiting for synchronization
 * @see Requirement 3.5 Offline queue support
 */
export interface SyncOperation {
  /**
   * Unique operation identifier
   * @format uuid
   */
  id: string;

  /**
   * Type of operation
   */
  type: 'CREATE' | 'UPDATE' | 'DELETE';

  /**
   * Entity type being operated on
   */
  entity: 'customer' | 'invoice' | 'service' | 'settings';

  /**
   * ID of the entity being operated on
   */
  entityId: string;

  /**
   * Operation payload (entity data for CREATE/UPDATE)
   */
  payload: unknown;

  /**
   * Timestamp when operation was queued
   * @format date-time
   */
  timestamp: string;

  /**
   * Number of sync retry attempts
   * @minimum 0
   * @maximum 10
   * @see Requirement 3.10 Retry with exponential backoff
   */
  retryCount: number;

  /**
   * Last error message if sync failed
   * @optional
   */
  lastError?: string;
}
