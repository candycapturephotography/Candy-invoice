# Implementation Plan: CandyCapture Photography Invoice Application

## Overview

This implementation plan converts the CandyCapture Photography Invoice Application design into actionable development tasks. The application is a multi-platform billing and invoice management system featuring:

- Branded invoice generation matching the reference design (pink/magenta #E91E63 theme)
- Multi-device synchronization via AWS cloud backend
- Offline-first architecture with sync queue
- Server-side sequential invoice number generation
- Windows desktop (Electron), web, and responsive mobile support

**Technology Stack:**
- Frontend: React 18 + TypeScript + Tailwind CSS + Vite
- Desktop: Electron 27+
- Backend: AWS Lambda + API Gateway + DynamoDB + Cognito
- Storage: IndexedDB (Dexie.js) for offline, DynamoDB for cloud
- PDF: jsPDF with custom canvas rendering

**Reference Assets:**
- Logo: `C:\kiro\Candy-Invoice\Logo.png`
- Reference Design: `C:\kiro\Candy-Invoice\Ref-Image.png`
- Existing App Reference: `C:\kiro\Invoice-exe\candycapture-app`

---

## Tasks

- [x] 1. Project Setup and Foundation
  - [x] 1.1 Initialize monorepo structure with pnpm workspaces
    - Create root package.json with workspaces configuration
    - Create pnpm-workspace.yaml defining packages/web, packages/electron, packages/backend
    - Set up shared TypeScript configuration (tsconfig.base.json)
    - Configure ESLint and Prettier for consistent code style
    - _Requirements: 20.3, 20.4_

  - [x] 1.2 Set up React web application with Vite and Tailwind CSS
    - Initialize packages/web with Vite React-TS template
    - Install and configure Tailwind CSS with custom theme colors (#E91E63 primary)
    - Configure path aliases for clean imports (@/components, @/services, etc.)
    - Set up index.html with proper meta tags and manifest link
    - _Requirements: 1.3, 14.1_

  - [x] 1.3 Create core TypeScript type definitions
    - Define Customer, Invoice, InvoiceService, Payment, Service, Settings interfaces
    - Define PaymentStatus enum ('PENDING' | 'PARTIALLY_PAID' | 'PAID')
    - Define SyncStatus type ('synced' | 'pending' | 'error')
    - Define API response types (ApiResponse, PaginatedResponse, SyncBatchRequest/Response)
    - _Requirements: 5.1, 6.1, 7.1-7.4_

  - [ ]* 1.4 Write property test for payment status determination
    - **Property 2: Payment Status Determination**
    - **Validates: Requirements 7.2, 7.3, 7.4**

- [-] 2. Checkpoint - Verify project builds and lints successfully
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Core Utility Functions
  - [x] 3.1 Implement Indian currency formatting utility
    - Create formatIndianCurrency function using Indian numbering system
    - Handle comma placement for lakhs and crores (₹X,XX,XXX.XX)
    - Ensure exactly 2 decimal places with Rupee symbol prefix
    - _Requirements: 7.5, 1.13, 10.3-10.5_

  - [ ]* 3.2 Write property test for currency formatting
    - **Property 10: Currency Formatting Consistency**
    - **Validates: Requirements 7.5**

  - [x] 3.3 Implement payment calculation utilities
    - Create calculateBalanceDue function (totalAmount - advancePaid)
    - Create calculatePaymentStatus function based on balance
    - Handle edge cases (zero amounts, overpayment)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 1.14_

  - [ ]* 3.4 Write property test for balance calculation
    - **Property 1: Payment Balance Calculation Accuracy**
    - **Validates: Requirements 1.14, 7.1**

  - [x] 3.5 Implement validation utilities
    - Create mobile number validator (exactly 10 digits)
    - Create email validator (proper format with @ and domain)
    - Create amount validator (0.01 to 99,999,999.99, 2 decimal places)
    - Create IFSC code validator (4 letters + 0 + 6 alphanumeric)
    - _Requirements: 5.2, 5.3, 7.6, 12.4_

  - [ ]* 3.6 Write property test for mobile validation
    - **Property 8: Mobile Number Validation**
    - **Validates: Requirements 5.2**

  - [x] 3.7 Implement date formatting and calculation utilities
    - Create formatDate function for Indian date format (DD-Mon-YYYY)
    - Create calculateDueDate function (default 15 days offset)
    - Create date range validation utilities
    - _Requirements: 8.3, 8.4, 8.5, 12.8_

- [~] 4. Checkpoint - Core utilities complete with passing tests
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Local Storage Layer (IndexedDB with Dexie.js)
  - [~] 5.1 Set up Dexie.js database schema
    - Create CandyCaptureDB class extending Dexie
    - Define tables: customers, invoices, services, settings, syncQueue, syncMeta
    - Configure indexes for efficient queries (name, mobile, eventDate, invoiceDate, paymentStatus)
    - _Requirements: 3.5, 13.7, 17.3_

  - [~] 5.2 Implement StorageService for customers
    - Create getCustomers with pagination and filtering
    - Create searchCustomers with partial matching on name/mobile
    - Create saveCustomer and deleteCustomer operations
    - Queue sync operations on each mutation
    - _Requirements: 5.4, 5.6, 5.7, 5.8_

  - [~] 5.3 Implement StorageService for invoices
    - Create getInvoices with date range and status filtering
    - Create saveInvoice with automatic balance/status calculation
    - Create deleteInvoice operation
    - Handle temporary invoice IDs for offline creation
    - _Requirements: 11.1, 11.4, 11.5, 4.6_

  - [~] 5.4 Implement StorageService for services and settings
    - Create getServices returning enabled services in display order
    - Create saveService with unique name enforcement
    - Create getSettings and saveSettings operations
    - _Requirements: 6.3, 6.5, 12.1, 12.4_

  - [~] 5.5 Implement sync queue management
    - Create queueOperation for CREATE/UPDATE/DELETE operations
    - Create getPendingOperations sorted by timestamp
    - Create removeOperation after successful sync
    - Limit queue to 1000 operations
    - _Requirements: 3.5, 3.6_

  - [ ]* 5.6 Write property test for sync queue ordering
    - **Property 11: Sync Queue Ordering**
    - **Validates: Requirements 3.6**

  - [~] 5.7 Implement data export functionality
    - Create exportData function returning all entities as JSON
    - Exclude authentication tokens and passwords
    - Generate filename with date format: CandyCapture-Backup-{YYYY-MM-DD}.json
    - _Requirements: 16.3, 16.10, 16.11_

  - [ ]* 5.8 Write property test for export completeness
    - **Property 12: Data Export Completeness**
    - **Validates: Requirements 16.3, 16.10**

  - [~] 5.9 Implement data import functionality
    - Create importData with JSON structure validation
    - Implement Merge strategy (add new, skip duplicates)
    - Implement Replace strategy (atomic delete and import)
    - _Requirements: 16.4, 16.5, 16.6, 16.7, 16.8, 16.9_

  - [ ]* 5.10 Write property test for import-export round trip
    - **Property 13: Import-Export Round Trip**
    - **Validates: Requirements 16.3, 16.4, 16.5**

- [~] 6. Checkpoint - Local storage layer complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Shared UI Components
  - [~] 7.1 Create base form components
    - Create Input component with validation states and Indian formatting
    - Create Select component for dropdowns
    - Create Checkbox and Toggle components
    - Create DatePicker component with date range support
    - Apply pink/magenta (#E91E63) accent styling
    - _Requirements: 14.5, 1.3_

  - [~] 7.2 Create feedback components
    - Create Toast component for notifications
    - Create Modal component for dialogs
    - Create LoadingSpinner component
    - Create ErrorBoundary with fallback UI
    - _Requirements: 17.1, 17.5, 9.11, 9.13_

  - [~] 7.3 Create data display components
    - Create DataTable with sortable columns and pagination
    - Create Badge component for payment status (PENDING/PARTIALLY_PAID/PAID colors)
    - Create StatusIndicator for sync status (Online/Offline/Syncing)
    - _Requirements: 11.1, 11.7, 3.4, 1.15_

  - [~] 7.4 Create layout components
    - Create Header with sync status indicator and logout
    - Create Sidebar with navigation links
    - Create MainLayout composing Header, Sidebar, and content area
    - Create responsive variants for mobile (bottom nav) and tablet
    - _Requirements: 14.2, 14.3, 14.4, 10.13_

- [ ] 8. Customer Management Feature
  - [~] 8.1 Create CustomerForm component
    - Implement all customer fields with validation
    - Show inline validation errors for mobile (10 digits) and email format
    - Support create and edit modes
    - _Requirements: 5.1, 5.2, 5.3_

  - [~] 8.2 Create CustomerList component
    - Display customers with invoice count
    - Implement search with 1+ character trigger
    - Show results within 500ms of typing
    - _Requirements: 5.4, 5.9, 19.2_

  - [~] 8.3 Create CustomerSearch component for invoice creation
    - Provide typeahead search with 2+ character trigger
    - Display matching customers within 500ms
    - Offer "Create New Customer" option when no match
    - _Requirements: 8.6, 8.7_

  - [~] 8.4 Implement customer deletion with protection
    - Check for associated invoices before deletion
    - Show error message if customer has invoices
    - Confirm and delete if no invoices exist
    - _Requirements: 5.7, 5.8_

  - [ ]* 8.5 Write property test for customer deletion protection
    - **Property 6: Customer Deletion Protection**
    - **Validates: Requirements 5.7**

- [ ] 9. Service Management Feature
  - [~] 9.1 Create ServiceManager component
    - List all services with name, default quantity, enabled status
    - Support drag-and-drop reordering
    - Pre-populate with 12 standard services
    - _Requirements: 6.1, 6.2, 6.10_

  - [~] 9.2 Create ServiceForm component
    - Validate unique service names (case-insensitive)
    - Validate quantity range (1-999)
    - Support create and edit modes
    - _Requirements: 6.4, 6.5, 6.6_

  - [~] 9.3 Implement service deletion with usage tracking
    - Track usageCount on each service
    - Prevent deletion of services used in invoices
    - Allow deletion of unused services
    - _Requirements: 6.8, 6.9_

  - [ ]* 9.4 Write property test for service usage tracking
    - **Property 7: Service Usage Tracking**
    - **Validates: Requirements 6.8, 6.9**

  - [~] 9.5 Create ServiceSelector component for invoices
    - Display only enabled services in configured order
    - Show checkboxes/toggles for selection
    - Pre-fill default quantity on selection
    - Allow quantity editing (1-999)
    - _Requirements: 6.3, 8.8, 8.9, 8.10_

- [~] 10. Checkpoint - Customer and service features complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Invoice Creation and Management
  - [~] 11.1 Create InvoiceForm component
    - Implement Customer Details section with search
    - Implement Services Selection section
    - Implement Payment Details (Total Amount, Advance Paid)
    - Auto-calculate Balance Due and Payment Status
    - Default Invoice Date to today, Due Date to +15 days
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [~] 11.2 Implement invoice form validation
    - Require at least one service selected
    - Require Total Amount > 0
    - Validate Advance Paid ≤ Total Amount with inline error
    - Show validation errors preventing save
    - _Requirements: 8.11, 8.12, 7.8_

  - [ ]* 11.3 Write property test for advance payment bounds
    - **Property 9: Advance Payment Upper Bound**
    - **Validates: Requirements 7.7, 7.8**

  - [~] 11.4 Implement auto-save draft functionality
    - Save form state to local storage every 30 seconds
    - Detect existing draft on form load (if < 24 hours old)
    - Offer restore or discard choice
    - _Requirements: 17.3, 17.4_

  - [ ]* 11.5 Write property test for draft recovery
    - **Property 15: Auto-Save Draft Recovery**
    - **Validates: Requirements 17.3, 17.4**

  - [~] 11.6 Create InvoiceList component
    - Display columns: Invoice Number, Customer Name, Event, Event Date, Total, Advance, Balance, Status, Dates
    - Implement search by Invoice Number and Customer Name
    - Implement Payment Status filter (All, Pending, Partially Paid, Paid)
    - Implement date range filters (From Date, To Date)
    - Paginate with 20 items per page
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

  - [~] 11.7 Create InvoiceView component
    - Display full invoice details in read-only mode
    - Show customer info, services, payment history
    - Provide Edit, Print, Download PDF, Duplicate buttons
    - _Requirements: 11.8, 11.9, 11.10, 11.11_

  - [~] 11.8 Implement invoice duplication
    - Pre-fill new form with selected invoice's data
    - Reset Invoice Number (request from server)
    - Reset Invoice Date to today, Due Date to default
    - Reset Advance Paid to zero
    - _Requirements: 11.10_

  - [~] 11.9 Implement payment recording
    - Support adding up to 50 payments per invoice
    - Validate payment amount (0.01 to remaining balance)
    - Validate payment date (invoice date to current date)
    - Recalculate Balance Due and Status on each payment
    - Support payment deletion with recalculation
    - _Requirements: 7.9, 7.10, 7.11, 7.12_

- [~] 12. Checkpoint - Invoice management complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. PDF Generation
  - [~] 13.1 Implement PDF layout engine with jsPDF
    - Configure A4 portrait (210mm × 297mm) with 15mm margins
    - Create helper functions for positioning and text rendering
    - Set up color constants (#E91E63 primary, status colors)
    - _Requirements: 9.1, 9.3, 9.4_

  - [~] 13.2 Render PDF header section
    - Draw logo at top-left (50mm width) or fallback text
    - Draw "INVOICE" title in pink at top-right
    - Draw invoice metadata box with pink border
    - Render Invoice No, Invoice Date, Due Date
    - _Requirements: 1.1, 1.2, 1.5, 1.6_

  - [~] 13.3 Render PDF Bill To / From sections
    - Draw "BILL TO" section with customer details
    - Draw "FROM" section with studio information
    - Include icons (person, location, phone, email, Instagram)
    - _Requirements: 1.7, 1.8, 1.19_

  - [~] 13.4 Render PDF services table
    - Draw table header with pink background (S.NO, SERVICE, QTY)
    - Render service rows with alternating backgrounds
    - Ensure exactly 3 columns - NO pricing columns
    - Support up to 25 services fitting on page
    - _Requirements: 1.9, 1.10, 2.1, 2.2, 2.6_

  - [ ]* 13.5 Write property test for services table columns
    - **Property 14: Services Table Column Constraint**
    - **Validates: Requirements 2.1, 2.4, 1.9, 1.10**

  - [~] 13.6 Render PDF notes and payment summary
    - Draw "NOTES" section with configurable terms
    - Draw "Thank You!" message with heart icon
    - Draw payment summary box (Total, Advance, Balance)
    - Highlight Balance Due row with pink background
    - Draw Payment Status badge with appropriate color
    - _Requirements: 1.11, 1.12, 1.13, 1.14, 1.15_

  - [~] 13.7 Render PDF payment details and footer
    - Draw "PAYMENT DETAILS" section with bank info
    - Draw "Authorized Signature" area
    - Draw footer bar with contact information
    - _Requirements: 1.16, 1.17, 1.18_

  - [~] 13.8 Implement PdfService interface
    - Create generateInvoicePdf returning Blob
    - Create previewInvoice returning data URL
    - Handle logo loading with graceful fallback
    - Ensure generation completes within 3 seconds
    - Ensure file size under 5MB
    - _Requirements: 9.2, 9.9, 9.10, 9.12_

  - [~] 13.9 Integrate PDF preview and download
    - Create InvoicePdf component with preview modal (800×600 min)
    - Implement Print button opening system dialog
    - Implement Download button saving as Invoice-{Number}.pdf
    - Show loading indicator during generation
    - Handle errors with retry (up to 3 attempts)
    - _Requirements: 9.5, 9.6, 9.7, 9.8, 9.11, 9.13_

- [~] 14. Checkpoint - PDF generation complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Dashboard
  - [~] 15.1 Create Dashboard page component
    - Display total invoice count and customer count
    - Display Total Invoice Value, Total Advance Received, Total Balance Pending
    - Display counts by Payment Status
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [~] 15.2 Create recent invoices widget
    - Display 10 most recent invoices by Invoice Date
    - Show Invoice Number, Customer Name, Total Amount, Payment Status
    - Link to invoice detail view
    - _Requirements: 10.7_

  - [~] 15.3 Implement dashboard status quick links
    - Create clickable Pending, Partially Paid, Paid counts
    - Navigate to InvoiceList filtered by selected status
    - _Requirements: 10.8_

  - [~] 15.4 Implement dashboard metrics loading
    - Load all metrics within 2 seconds
    - Update metrics within 2 seconds of sync completion
    - Show zero values and empty state for new accounts
    - Handle loading errors with retry option
    - _Requirements: 10.9, 10.10, 10.11, 10.12_

- [ ] 16. Settings Management
  - [~] 16.1 Create BusinessSettings component
    - Implement business info fields (Name, Address, Phone, Email, Instagram)
    - Implement logo upload with validation (PNG/JPG, 2MB max, 1024×1024 max)
    - Show specific validation errors
    - _Requirements: 12.1, 12.2, 12.3_

  - [~] 16.2 Create BankSettings component
    - Implement bank detail fields (Account Name, Bank Name, Account No, IFSC, UPI)
    - Validate IFSC format (4 letters + 0 + 6 alphanumeric)
    - Validate UPI format (username@provider)
    - _Requirements: 12.4_

  - [~] 16.3 Create InvoiceSettings component
    - Implement invoice prefix setting (1-10 alphanumeric/hyphens)
    - Implement default notes/terms textarea (max 2000 chars)
    - Implement default due date offset (0-365 days)
    - _Requirements: 12.6, 12.7, 12.8_

  - [~] 16.4 Implement settings synchronization
    - Sync changes to cloud within 5 seconds
    - Apply to new invoices only (no retroactive changes)
    - _Requirements: 12.9, 12.10, 12.11, 12.12_

- [~] 17. Checkpoint - Frontend features complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 18. AWS Infrastructure Setup
  - [~] 18.1 Create Terraform configuration for DynamoDB
    - Define main table with PK/SK and GSI1
    - Configure PAY_PER_REQUEST billing
    - Enable point-in-time recovery
    - _Requirements: 3.1, 16.1, 16.2_

  - [~] 18.2 Create Terraform configuration for Cognito
    - Define user pool with password policy (8+ chars, upper, lower, number)
    - Configure email recovery
    - Set up rate limiting (5 failures / 15 min)
    - _Requirements: 15.4, 15.10_

  - [~] 18.3 Create Terraform configuration for API Gateway
    - Set up REST API with Cognito authorizer
    - Configure CORS for allowed origins
    - Set up WebSocket API for real-time sync
    - _Requirements: 3.8, 3.9_

  - [~] 18.4 Create Terraform configuration for Lambda functions
    - Define functions for each API endpoint
    - Configure IAM roles with least privilege
    - Set up CloudWatch logging
    - _Requirements: 17.6_

  - [~] 18.5 Create Terraform configuration for S3
    - Set up bucket for logo storage and backups
    - Configure lifecycle rules for backup retention (30 days)
    - _Requirements: 16.2_

- [ ] 19. Backend API Implementation
  - [~] 19.1 Implement authentication handlers
    - Create login handler with JWT token generation
    - Create refresh token handler with 5-min early refresh
    - Create logout handler clearing session
    - Create password change handler
    - Log all auth attempts with timestamp and IP
    - _Requirements: 15.1, 15.2, 15.6, 15.7, 15.8, 15.9, 15.12_

  - [~] 19.2 Implement invoice number service
    - Create atomic counter in DynamoDB (INVOICE_COUNTER)
    - Generate format: {prefix}NNNN starting from 1001
    - Return error at 9999 limit
    - Reserve number immediately on request
    - Support prefix changes with sequence continuation
    - _Requirements: 4.1, 4.2, 4.3, 4.8, 4.9, 4.10_

  - [ ]* 19.3 Write property test for invoice number uniqueness
    - **Property 3: Invoice Number Uniqueness**
    - **Validates: Requirements 4.1, 4.3, 4.8**

  - [ ]* 19.4 Write property test for invoice number format
    - **Property 4: Invoice Number Format Compliance**
    - **Validates: Requirements 4.1, 4.9**

  - [~] 19.5 Implement customer API handlers
    - Create GET /customers with pagination
    - Create GET /customers/:id
    - Create GET /customers/search with partial matching
    - Create POST /customers with validation
    - Create PUT /customers/:id
    - Create DELETE /customers/:id with invoice check
    - _Requirements: 5.1-5.9_

  - [~] 19.6 Implement invoice API handlers
    - Create GET /invoices with filtering and pagination
    - Create GET /invoices/:id with payments
    - Create POST /invoices with auto-number allocation
    - Create PUT /invoices/:id
    - Create DELETE /invoices/:id
    - Create POST /invoices/:id/payments
    - Create DELETE /invoices/:id/payments/:paymentId
    - _Requirements: 8.1-8.13, 7.9-7.12, 11.1-11.11_

  - [~] 19.7 Implement service API handlers
    - Create GET /services
    - Create POST /services with unique name check
    - Create PUT /services/:id
    - Create DELETE /services/:id with usage check
    - Create PUT /services/reorder
    - _Requirements: 6.1-6.11_

  - [~] 19.8 Implement settings API handlers
    - Create GET /settings
    - Create PUT /settings
    - Create POST /settings/logo with S3 upload
    - _Requirements: 12.1-12.12_

  - [~] 19.9 Implement sync API handlers
    - Create POST /sync/batch processing operations chronologically
    - Create GET /sync/changes for delta sync
    - Handle temporary ID replacement for offline invoices
    - Implement last-write-wins conflict resolution
    - _Requirements: 3.2, 3.3, 3.6, 3.7, 4.6, 4.7_

  - [ ]* 19.10 Write property test for offline invoice number transition
    - **Property 5: Offline-Online Invoice Number Transition**
    - **Validates: Requirements 4.6, 4.7**

  - [~] 19.11 Implement data management handlers
    - Create GET /export generating JSON backup
    - Create POST /import with validation and merge/replace
    - _Requirements: 16.3-16.12_

- [~] 20. Checkpoint - Backend APIs complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 21. Sync Engine Integration
  - [~] 21.1 Implement SyncService
    - Manage connection status (online/offline/syncing/error)
    - Detect network changes with navigator.onLine
    - Expose onStatusChange callback
    - _Requirements: 3.4, 17.2_

  - [~] 21.2 Implement sync queue processing
    - Process queued operations in chronological order
    - Batch operations (max 25 per batch)
    - Update local entities with server data (including real invoice numbers)
    - Apply server changes to local DB
    - _Requirements: 3.5, 3.6, 4.7_

  - [~] 21.3 Implement retry with exponential backoff
    - Retry failed operations: 1s → 2s → 4s → 8s → max 60s
    - Max 10 retry attempts before marking failed
    - Add jitter to prevent thundering herd
    - _Requirements: 3.10_

  - [~] 21.4 Implement automatic sync triggers
    - Sync within 5 seconds of local data creation
    - Propagate server changes within 10 seconds
    - Display offline status after 30 seconds unreachable
    - _Requirements: 3.2, 3.3, 3.11_

  - [~] 21.5 Implement WebSocket real-time sync
    - Connect to WebSocket API with JWT
    - Handle DATA_CHANGED events
    - Handle REFRESH_REQUIRED events
    - Reconnect on disconnect
    - _Requirements: 3.3_

  - [~] 21.6 Implement first-time device sync
    - Download all existing data on first sign-in
    - Block invoice creation until initial sync complete
    - _Requirements: 3.13_

- [ ] 22. Authentication Integration
  - [~] 22.1 Implement AuthService
    - Create login function with Cognito
    - Create logout clearing tokens and cached data
    - Create refreshToken with auto-refresh 5 min before expiry
    - Create isAuthenticated check
    - _Requirements: 15.2, 15.6, 15.7, 15.8, 15.13_

  - [~] 22.2 Implement secure token storage
    - Store tokens in memory only (not localStorage)
    - Clear on logout and tab close
    - _Requirements: 15.5_

  - [~] 22.3 Create LoginPage component
    - Username and password fields
    - Generic error message (not revealing which field is wrong)
    - Handle rate limit errors showing lockout time
    - _Requirements: 15.2, 15.9, 15.11_

  - [~] 22.4 Implement AuthContext and protected routes
    - Wrap app with AuthProvider
    - Redirect to login on session expiry
    - Protect all routes requiring authentication
    - _Requirements: 15.1, 15.8_

- [~] 23. Checkpoint - Sync and auth complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 24. Error Handling and Reliability
  - [~] 24.1 Implement global error handling
    - Create ErrorBoundary catching React errors
    - Display fallback UI with reload/dashboard options
    - Log errors to backend
    - _Requirements: 17.5, 17.6_

  - [~] 24.2 Implement network error handling
    - Show retry button on network failures (up to 3 attempts)
    - Switch to offline mode after 5 seconds unreachable
    - Display visible offline indicator
    - _Requirements: 17.1, 17.2_

  - [~] 24.3 Implement Report Issue functionality
    - Create Report Issue button in navigation
    - Collect and send error logs (up to 1MB)
    - _Requirements: 17.7_

  - [~] 24.4 Disable offline-incompatible features
    - Disable invoice number generation when offline
    - Disable data export when offline
    - Show unavailable message for disabled features
    - _Requirements: 17.8_

- [ ] 25. Demo Mode
  - [~] 25.1 Implement Demo Mode toggle
    - Create Demo Mode button on main screen
    - Load sample data to separate storage location
    - Display persistent "DEMO MODE" banner
    - _Requirements: 18.1, 18.2, 18.5_

  - [~] 25.2 Create sample data
    - Customer: Bala, 9500440272
    - Invoice: CC-1001, Wedding, 20-Nov-2026, Sivakasi
    - 10 services, ₹1,20,000 total, ₹20,000 advance
    - Status: PARTIALLY_PAID
    - _Requirements: 18.3, 18.4_

  - [~] 25.3 Implement Clear Demo Data
    - Show Clear Demo Data button only in Demo Mode
    - Require confirmation dialog before deletion
    - Remove all demo data and reset to initial state
    - _Requirements: 18.6, 18.7, 18.8_

- [ ] 26. Electron Desktop Application
  - [~] 26.1 Set up Electron project
    - Create packages/electron with main.ts and preload.ts
    - Configure electron-builder.yml
    - Set up app icon (Logo.png converted to ICO)
    - _Requirements: 13.1, 13.5_

  - [~] 26.2 Configure Electron window and behavior
    - Create main window loading web app
    - Display app within 5 seconds on min-spec hardware
    - Handle offline mode with local data access
    - _Requirements: 13.6, 13.7_

  - [~] 26.3 Implement sync notifications
    - Show system tray notification on sync complete/failure
    - _Requirements: 13.8_

  - [~] 26.4 Configure build and packaging
    - Set up NSIS installer creating desktop and Start Menu shortcuts
    - Generate portable executable version
    - Target Windows 10/11, 32-bit and 64-bit
    - _Requirements: 13.2, 13.3, 13.4, 13.9_

- [ ] 27. Responsive Mobile Support
  - [~] 27.1 Implement mobile layout (320px-767px)
    - Single-column layout with bottom navigation
    - Full-width form fields
    - Collapsible menu sections
    - Minimum 16px font size, 44×44px tap targets
    - _Requirements: 14.2, 14.5_

  - [~] 27.2 Implement tablet layout (768px-1023px)
    - Two-column layout with side navigation drawer
    - 2-column invoice list
    - Inline form validation messages
    - _Requirements: 14.3_

  - [~] 27.3 Implement mobile-specific features
    - Swipe-to-reveal edit/delete on invoice list
    - Pinch-to-zoom on PDF preview (50%-300%)
    - Orientation change reflow within 500ms
    - _Requirements: 14.6, 14.8, 14.9_

- [~] 28. Checkpoint - All platforms complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 29. Performance Optimization
  - [~] 29.1 Optimize initial load performance
    - Implement code splitting and lazy loading
    - Optimize bundle size
    - Ensure dashboard loads within 3 seconds
    - _Requirements: 19.1_

  - [~] 29.2 Optimize search and query performance
    - Implement debounced search (500ms threshold)
    - Ensure search results render within 500ms
    - Test with 10,000 customers and 50,000 invoices
    - _Requirements: 19.2, 19.5, 19.6_

  - [~] 29.3 Optimize PDF generation performance
    - Pre-load fonts and logo
    - Ensure generation within 3 seconds for 50 items
    - _Requirements: 19.3_

  - [~] 29.4 Optimize sync performance
    - Batch operations efficiently
    - Ensure single-record sync within 5 seconds
    - _Requirements: 19.4_

- [ ] 30. Final Integration and Documentation
  - [~] 30.1 Create README with setup instructions
    - Document prerequisites and installation steps
    - Document build commands for all packages
    - Document deployment instructions
    - _Requirements: 20.5_

  - [~] 30.2 Create environment configuration templates
    - Create .env.example with all required variables
    - Document each variable with description and example
    - _Requirements: 20.7_

  - [~] 30.3 Create deployment documentation
    - Document AWS infrastructure setup
    - Document environment configuration
    - Document service deployment steps
    - _Requirements: 20.6_

  - [~] 30.4 Create logo configuration guide
    - Document how to replace Logo.png
    - Document supported formats and dimensions
    - _Requirements: 20.8_

  - [~] 30.5 Ensure no secrets in repository
    - Audit all files for secrets/passwords/API keys
    - Verify .gitignore excludes sensitive files
    - _Requirements: 20.4_

- [~] 31. Final Checkpoint - Complete end-to-end testing
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties defined in design document
- Unit tests validate specific examples and edge cases
- The existing reference app at `C:\kiro\Invoice-exe\candycapture-app` can be used for guidance on patterns
- Critical constraint: Services table must have ONLY S.NO, SERVICE, QTY columns - NO pricing columns
- All monetary values must use Indian numbering format (₹X,XX,XXX.XX)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["1.4", "3.1", "3.3", "3.5", "3.7"] },
    { "id": 3, "tasks": ["3.2", "3.4", "3.6"] },
    { "id": 4, "tasks": ["5.1"] },
    { "id": 5, "tasks": ["5.2", "5.3", "5.4", "5.5"] },
    { "id": 6, "tasks": ["5.6", "5.7", "5.9"] },
    { "id": 7, "tasks": ["5.8", "5.10"] },
    { "id": 8, "tasks": ["7.1", "7.2", "7.3", "7.4"] },
    { "id": 9, "tasks": ["8.1", "8.2", "9.1", "9.2"] },
    { "id": 10, "tasks": ["8.3", "8.4", "9.3", "9.5"] },
    { "id": 11, "tasks": ["8.5", "9.4"] },
    { "id": 12, "tasks": ["11.1", "11.6"] },
    { "id": 13, "tasks": ["11.2", "11.4", "11.7", "11.8", "11.9"] },
    { "id": 14, "tasks": ["11.3", "11.5"] },
    { "id": 15, "tasks": ["13.1"] },
    { "id": 16, "tasks": ["13.2", "13.3", "13.4"] },
    { "id": 17, "tasks": ["13.5", "13.6", "13.7"] },
    { "id": 18, "tasks": ["13.8", "13.9"] },
    { "id": 19, "tasks": ["15.1", "15.2", "15.3", "15.4"] },
    { "id": 20, "tasks": ["16.1", "16.2", "16.3"] },
    { "id": 21, "tasks": ["16.4"] },
    { "id": 22, "tasks": ["18.1", "18.2", "18.3", "18.4", "18.5"] },
    { "id": 23, "tasks": ["19.1", "19.2"] },
    { "id": 24, "tasks": ["19.3", "19.4", "19.5", "19.6", "19.7", "19.8"] },
    { "id": 25, "tasks": ["19.9", "19.11"] },
    { "id": 26, "tasks": ["19.10"] },
    { "id": 27, "tasks": ["21.1", "21.2", "21.3"] },
    { "id": 28, "tasks": ["21.4", "21.5", "21.6"] },
    { "id": 29, "tasks": ["22.1", "22.2", "22.3", "22.4"] },
    { "id": 30, "tasks": ["24.1", "24.2", "24.3", "24.4"] },
    { "id": 31, "tasks": ["25.1", "25.2"] },
    { "id": 32, "tasks": ["25.3"] },
    { "id": 33, "tasks": ["26.1"] },
    { "id": 34, "tasks": ["26.2", "26.3"] },
    { "id": 35, "tasks": ["26.4"] },
    { "id": 36, "tasks": ["27.1", "27.2", "27.3"] },
    { "id": 37, "tasks": ["29.1", "29.2", "29.3", "29.4"] },
    { "id": 38, "tasks": ["30.1", "30.2", "30.3", "30.4", "30.5"] }
  ]
}
```
