# Requirements Document

## Introduction

CandyCapture Photography Invoice Application is a production-ready, multi-device synchronized billing and invoice management system designed for CandyCapture Photography studio. The application enables creating professional photography service invoices with a distinctive pink/magenta branded design, managing customers, tracking payments, and synchronizing data across multiple Windows laptops and mobile devices through a central cloud backend.

The invoice design MUST match the reference image exactly: logo at top-left, pink/magenta color scheme (#E91E63), A4 portrait layout, and a simplified service table containing only S.NO, SERVICE, and QTY columns (no individual service pricing). The user enters ONE total package amount instead of per-service rates.

## Glossary

- **Invoice_Application**: The complete CandyCapture Photography invoice management system including frontend clients and cloud backend
- **Invoice_Generator**: The component responsible for creating and rendering invoice documents matching the reference design
- **Customer_Manager**: The component that handles customer data operations (add, edit, search, view, reuse)
- **Service_Manager**: The component that manages configurable photography services
- **Payment_Tracker**: The component that calculates and tracks payment status based on total amount and advance paid
- **Sync_Engine**: The component responsible for multi-device data synchronization via cloud backend
- **PDF_Generator**: The component that produces print-ready A4 PDF invoices
- **Cloud_Backend**: The central server and database providing data persistence and synchronization
- **Offline_Queue**: The local storage mechanism that queues operations when offline for later synchronization
- **Invoice_Number_Service**: The server-side component that generates unique sequential invoice numbers
- **Settings_Manager**: The component that manages business information, bank details, and application configuration
- **Dashboard**: The main view displaying business metrics, recent invoices, and payment summaries
- **Payment_Status**: One of three states: PENDING (no advance), PARTIALLY_PAID (partial advance), or PAID (full amount)

## Requirements

### Requirement 1: Invoice Design Compliance

**User Story:** As a studio owner, I want the generated invoice to exactly match my branded reference design, so that my invoices maintain professional consistency and brand identity.

#### Acceptance Criteria

1. THE Invoice_Generator SHALL render the CandyCapture Photography logo from the provided logo file (Logo.png) at the top-left corner of the invoice
2. IF the logo file (Logo.png) is missing or cannot be loaded, THEN THE Invoice_Generator SHALL display a placeholder area with the text "CandyCapture Photography" in the primary accent color
3. THE Invoice_Generator SHALL use the pink/magenta color scheme (#E91E63) as the primary accent color for headers, borders, and highlights
4. THE Invoice_Generator SHALL render the invoice in A4 portrait orientation (210mm × 297mm)
5. THE Invoice_Generator SHALL display the "INVOICE" title in pink/magenta (#E91E63) at the top-right corner
6. THE Invoice_Generator SHALL display the invoice metadata box (Invoice No, Invoice Date, Due Date) with pink border below the title
7. THE Invoice_Generator SHALL display a "BILL TO" section on the left containing customer Name, Mobile, Event, Event Date, and Location
8. THE Invoice_Generator SHALL display a "FROM" section on the right containing studio name, address, phone, email, and Instagram handle
9. THE Invoice_Generator SHALL display a "SERVICES BOOKED" section with a table containing exactly three columns: S.NO, SERVICE, and QTY, supporting a minimum of 1 and maximum of 50 service rows
10. THE Invoice_Generator SHALL NOT display Rate, Amount, or any per-service pricing columns in the services table
11. THE Invoice_Generator SHALL display a "NOTES" section on the left side with configurable terms and conditions
12. THE Invoice_Generator SHALL display a "Thank You!" message with heart icon below the notes section
13. THE Invoice_Generator SHALL display a payment summary box on the right showing TOTAL AMOUNT, ADVANCE PAID, and BALANCE DUE formatted in Indian Rupees (₹) with Indian numbering format (e.g., ₹1,20,000.00), with pink highlighting (#E91E63 background) on the BALANCE DUE row
14. THE Invoice_Generator SHALL calculate BALANCE DUE as TOTAL AMOUNT minus ADVANCE PAID
15. THE Invoice_Generator SHALL display the PAYMENT STATUS badge as "PENDING" with orange/amber background (#FF9800) when ADVANCE PAID equals zero, "PARTIALLY PAID" with yellow background (#FFC107) when ADVANCE PAID is greater than zero but less than TOTAL AMOUNT, or "PAID" with green background (#4CAF50) when ADVANCE PAID equals or exceeds TOTAL AMOUNT
16. THE Invoice_Generator SHALL display a "PAYMENT DETAILS" section with bank account information (Account Name, Bank Name, Account No, IFSC Code, UPI ID)
17. THE Invoice_Generator SHALL display an "Authorized Signature" area with the studio name
18. THE Invoice_Generator SHALL display a footer bar with phone number, email, and Instagram handle
19. THE Invoice_Generator SHALL include the tagline "We Capture Your Sweetest Moments" below the logo

---

### Requirement 2: Service Table Structure

**User Story:** As a studio owner, I want a simplified service table without individual pricing, so that I can offer package-based pricing instead of itemized rates.

#### Acceptance Criteria

1. THE Invoice_Generator SHALL render the services table with exactly three columns: S.NO (serial number), SERVICE (service name with maximum 100 characters), and QTY (quantity as whole number from 1 to 9999)
2. THE Invoice_Generator SHALL auto-number services sequentially starting from 1 in the S.NO column
3. THE Invoice_Application SHALL provide a single "Total Amount" input field for the entire package price, accepting values from 0.01 to 99,999,999.99 with exactly 2 decimal places
4. THE Invoice_Application SHALL NOT display any price column, unit rate, or calculated line totals in the services table
5. WHEN a user adds a service to an invoice, THE Invoice_Application SHALL display the service with its quantity only, without any price information
6. THE Invoice_Generator SHALL support displaying 15 to 25 services in a single invoice while fitting all content within A4 portrait page printable margins without truncation
7. IF a user attempts to add a service with an empty service name, THEN THE Invoice_Application SHALL reject the entry and display an error message indicating the service name is required
8. IF a user enters a quantity that is not a whole number between 1 and 9999, THEN THE Invoice_Application SHALL reject the entry and display an error message indicating valid quantity range
9. IF a user enters a total amount that is not a positive number with up to 2 decimal places within the valid range, THEN THE Invoice_Application SHALL reject the entry and display an error message indicating valid amount format

---

### Requirement 3: Multi-Device Synchronization

**User Story:** As a studio owner with multiple laptops and mobile devices, I want all my invoice data synchronized automatically, so that I can access and create invoices from any device.

#### Acceptance Criteria

1. THE Cloud_Backend SHALL provide a central database for storing all customers, invoices, services, and settings
2. WHEN an invoice is created on any device, THE Sync_Engine SHALL transmit the invoice data to the Cloud_Backend within 5 seconds of creation
3. WHEN the Cloud_Backend receives new or updated data, THE Sync_Engine SHALL propagate changes to all devices that have an active authenticated session and network connectivity within 10 seconds
4. THE Invoice_Application SHALL display a sync status indicator in the application header showing connection state (Online/Offline/Syncing)
5. WHILE the device is offline, THE Offline_Queue SHALL store up to 1000 create, update, and delete operations locally
6. WHEN connectivity is restored, THE Sync_Engine SHALL process all queued operations in chronological order
7. IF a sync conflict occurs (same record modified on multiple devices), THEN THE Sync_Engine SHALL resolve using last-write-wins strategy with server timestamp
8. THE Cloud_Backend SHALL use HTTPS for all data transmission
9. THE Cloud_Backend SHALL require authentication before allowing any data access
10. THE Sync_Engine SHALL retry failed sync operations with exponential backoff (1s, 2s, 4s, 8s, max 60s) for a maximum of 10 retry attempts before marking the operation as failed
11. IF the Cloud_Backend is unreachable for more than 30 seconds, THEN THE Invoice_Application SHALL display an error message indicating server unavailability and switch to offline mode
12. IF authentication fails or the session expires, THEN THE Invoice_Application SHALL display an error message indicating authentication is required and prompt the user to re-authenticate
13. WHEN a user signs in on a new device for the first time, THE Sync_Engine SHALL download all existing data from the Cloud_Backend before allowing invoice creation or modification

---

### Requirement 4: Unique Invoice Number Generation

**User Story:** As a studio owner, I want invoice numbers to be unique across all devices, so that I never have duplicate invoice numbers regardless of which device creates the invoice.

#### Acceptance Criteria

1. THE Invoice_Number_Service SHALL generate sequential invoice numbers in the format "{prefix}NNNN" where prefix is configurable (default: "CC-") and NNNN is a 4-digit number starting from 1001
2. IF the sequence reaches 9999, THEN THE Invoice_Number_Service SHALL reject new number requests and return an error indicating the sequence limit has been reached
3. THE Invoice_Number_Service SHALL run exclusively on the Cloud_Backend to ensure uniqueness
4. WHEN a new invoice is initiated, THE Invoice_Application SHALL request the next invoice number from the Invoice_Number_Service with a 5-second timeout
5. THE Invoice_Application SHALL retry the invoice number request up to 2 times at 2-second intervals before falling back to offline mode
6. IF the device is offline when creating an invoice, THEN THE Invoice_Application SHALL assign a temporary local ID in format "TEMP-NNNN" and obtain the permanent invoice number upon sync
7. WHEN the device establishes connection after offline invoice creation, THE Invoice_Application SHALL replace the temporary ID with the permanent invoice number within the same sync session
8. THE Invoice_Number_Service SHALL reserve the allocated number immediately upon request, even if the invoice creation is later cancelled
9. THE Settings_Manager SHALL allow configuring the invoice prefix (1-10 alphanumeric characters or hyphens, default: "CC-")
10. THE Invoice_Number_Service SHALL support prefix changes and continue the sequence from the last number

---

### Requirement 5: Customer Management

**User Story:** As a studio employee, I want to manage customer information efficiently, so that I can quickly create invoices for new and returning customers.

#### Acceptance Criteria

1. THE Customer_Manager SHALL store the following fields for each customer: Name (required, max 100 characters), Mobile (required, 10 digits), Email (optional, max 254 characters), Address (optional, max 500 characters), Event Type (required, max 100 characters), Event Date (required), Location (required, max 200 characters), and Notes (optional, max 1000 characters)
2. IF a mobile number is not exactly 10 digits, THEN THE Customer_Manager SHALL display an error message indicating the mobile number must be 10 digits
3. IF an email is provided and does not contain exactly one @ symbol followed by a valid domain with at least one dot, THEN THE Customer_Manager SHALL display an error message indicating invalid email format
4. WHEN a user types at least 1 character in the search field, THE Customer_Manager SHALL search across Name and Mobile fields with partial matching and display results within 500 milliseconds
5. WHEN a user selects an existing customer for a new invoice, THE Customer_Manager SHALL pre-fill all customer fields in the invoice form
6. WHEN a user confirms an edit action on a customer record, THE Customer_Manager SHALL save the changes and display a confirmation message
7. IF a user attempts to delete a customer who has associated invoices, THEN THE Customer_Manager SHALL prevent deletion and display a message indicating the customer has existing invoices
8. WHEN a user deletes a customer with no associated invoices, THE Customer_Manager SHALL remove the customer record and display a confirmation message
9. THE Customer_Manager SHALL display the count of invoices associated with each customer in the customer list

---

### Requirement 6: Service Management

**User Story:** As a studio owner, I want to configure my available photography services, so that I can quickly select them when creating invoices.

#### Acceptance Criteria

1. THE Service_Manager SHALL maintain a list of configurable photography services with fields: Name (required, 1 to 100 characters), Default Quantity (integer, 1 to 999, default: 1), Enabled (default: true)
2. THE Service_Manager SHALL pre-populate with standard services: Traditional Photo, Traditional Video, Candid Photo, Candid Video, Pen Drive + Hard Disk, Photo Frames, Teaser, E-Invite, Traditional Film, Post-Wedding, Pre-Wedding, Album
3. WHEN creating an invoice, THE Invoice_Application SHALL display only enabled services for selection in the configured display order
4. THE Service_Manager SHALL support adding new custom services up to a maximum of 50 total services
5. THE Service_Manager SHALL enforce unique service names using case-insensitive comparison
6. THE Service_Manager SHALL support editing existing service names and default quantities
7. THE Service_Manager SHALL support enabling and disabling services without deletion
8. THE Service_Manager SHALL support deleting services that have never been used in any invoice
9. IF a user attempts to delete a service that has been used in an existing invoice, THEN THE Service_Manager SHALL prevent the deletion and display an indication that the service is in use
10. THE Service_Manager SHALL allow reordering services to control display order in the selection list
11. IF service data validation fails when adding or editing a service, THEN THE Service_Manager SHALL display an indication of the validation error and retain the entered data for correction

---

### Requirement 7: Payment Calculation and Status

**User Story:** As a studio owner, I want automatic payment status tracking, so that I can easily see which invoices are pending, partially paid, or fully paid.

#### Acceptance Criteria

1. THE Payment_Tracker SHALL calculate Balance Due as: Total Amount minus Advance Paid
2. WHEN Advance Paid equals zero, THE Payment_Tracker SHALL set Payment Status to "PENDING"
3. WHEN Advance Paid is greater than zero and less than Total Amount, THE Payment_Tracker SHALL set Payment Status to "PARTIALLY_PAID"
4. WHEN Advance Paid equals or exceeds Total Amount, THE Payment_Tracker SHALL set Payment Status to "PAID"
5. THE Invoice_Application SHALL display amounts in Indian Rupee format with comma separators and 2 decimal places (e.g., ₹1,20,000.00)
6. THE Invoice_Application SHALL accept Total Amount values from ₹1.00 to ₹99,99,999.99 with 2 decimal place precision
7. THE Invoice_Application SHALL accept Advance Paid values from ₹0.00 to the Total Amount
8. IF Advance Paid exceeds Total Amount, THEN THE Invoice_Application SHALL display an inline validation error message near the Advance Paid field indicating that advance cannot exceed total amount, and prevent saving
9. THE Invoice_Application SHALL support recording up to 50 advance payments for a single invoice, where each payment includes an amount between ₹0.01 and the remaining Balance Due, and a payment date
10. WHEN additional advance payment is recorded, THE Payment_Tracker SHALL recalculate Balance Due and update Payment Status automatically
11. THE Invoice_Application SHALL accept payment dates from the invoice creation date up to the current date
12. WHEN user requests to delete a recorded advance payment, THE Invoice_Application SHALL remove the payment, recalculate Balance Due, and update Payment Status accordingly

---

### Requirement 8: Invoice Creation Workflow

**User Story:** As a studio employee, I want a streamlined invoice creation process, so that I can quickly generate professional invoices during customer interactions.

#### Acceptance Criteria

1. THE Invoice_Application SHALL provide an invoice creation form with sections: Customer Details, Services Selection, Payment Details (containing Total Amount and Advance Paid input fields)
2. WHEN user starts creating a new invoice, THE Invoice_Application SHALL request and display the next invoice number from the server within 5 seconds
3. THE Invoice_Application SHALL default Invoice Date to the current date
4. THE Invoice_Application SHALL default Due Date to 15 days from Invoice Date
5. THE Invoice_Application SHALL allow manual adjustment of both Invoice Date and Due Date within a range of 1 year before to 2 years after the current date
6. WHEN user types at least 2 characters in the customer search field, THE Invoice_Application SHALL display customers matching the search text within 500 milliseconds
7. WHEN no matching customer is found, THE Invoice_Application SHALL provide an option to create a new customer with required fields: Name, Mobile, Event Type, Event Date, and Location
8. THE Invoice_Application SHALL provide checkboxes or toggles for selecting services from the enabled services list
9. WHEN a service is selected, THE Invoice_Application SHALL pre-fill the quantity with the service's default quantity
10. THE Invoice_Application SHALL allow editing the quantity for each selected service within a range of 1 to 999
11. IF no service is selected when user attempts to save, THEN THE Invoice_Application SHALL display a validation error indicating that at least one service must be selected and prevent saving
12. IF Total Amount is zero or empty when user attempts to save, THEN THE Invoice_Application SHALL display a validation error indicating that Total Amount must be greater than zero and prevent saving
13. WHEN user clicks Save and all validations pass, THE Invoice_Application SHALL create the invoice record and trigger synchronization

---

### Requirement 9: PDF Generation and Export

**User Story:** As a studio employee, I want to generate high-quality PDF invoices, so that I can print or share them with customers.

#### Acceptance Criteria

1. THE PDF_Generator SHALL produce PDF documents in A4 portrait format (210mm × 297mm) with margins of 15mm on all sides
2. THE PDF_Generator SHALL embed the logo image from the logo file configured in Settings_Manager
3. THE PDF_Generator SHALL render all text clearly at print-ready resolution (minimum 300 DPI equivalent)
4. THE PDF_Generator SHALL preserve the exact layout and styling from the reference design including the pink/magenta color scheme (#E91E63), section positioning, and typography hierarchy
5. WHEN an invoice has been saved with valid data, THE Invoice_Application SHALL enable the "Preview", "Print", and "Download PDF" buttons
6. WHEN the user clicks the "Preview" button, THE Invoice_Application SHALL display the invoice PDF in a preview window with minimum dimensions of 800×600 pixels
7. WHEN the user clicks the "Print" button, THE Invoice_Application SHALL open the system print dialog with the invoice PDF
8. WHEN the user clicks the "Download PDF" button, THE Invoice_Application SHALL save the invoice as a PDF file with filename format "Invoice-{InvoiceNumber}.pdf"
9. THE PDF_Generator SHALL complete PDF generation within 3 seconds for an invoice containing up to 15 services
10. THE PDF_Generator SHALL produce PDF files not exceeding 5MB in size to ensure compatibility with WhatsApp and email sharing
11. WHILE PDF is generating, THE Invoice_Application SHALL display a loading indicator and disable the Preview, Print, and Download PDF buttons
12. IF the configured logo file is unavailable, THEN THE PDF_Generator SHALL generate the PDF without the logo and display a warning message indicating the logo is missing
13. IF PDF generation fails, THEN THE Invoice_Application SHALL display an error message indicating the failure reason and provide a retry button allowing up to 3 retry attempts

---

### Requirement 10: Dashboard and Metrics

**User Story:** As a studio owner, I want to see business metrics at a glance, so that I can monitor my studio's financial performance.

#### Acceptance Criteria

1. THE Dashboard SHALL display the total count of all invoices
2. THE Dashboard SHALL display the total count of all customers
3. THE Dashboard SHALL display the sum of all invoice Total Amounts as "Total Invoice Value" in Indian Rupee format with comma separators (e.g., ₹1,20,000.00)
4. THE Dashboard SHALL display the sum of all Advance Paid amounts as "Total Advance Received" in Indian Rupee format with comma separators
5. THE Dashboard SHALL display the sum of all Balance Due amounts as "Total Balance Pending" in Indian Rupee format with comma separators
6. THE Dashboard SHALL display counts of invoices by Payment Status (PENDING, PARTIALLY_PAID, PAID)
7. THE Dashboard SHALL display a list of the 10 most recent invoices sorted by Invoice Date descending, showing Invoice Number, Customer Name, Total Amount, and Payment Status
8. WHEN user clicks a Payment Status quick link (Pending, Partially Paid, or Paid), THE Dashboard SHALL navigate to the invoice list view filtered by that Payment Status
9. WHEN data changes due to synchronization, THE Dashboard SHALL update all displayed metrics within 2 seconds of sync completion
10. WHEN user navigates to the Dashboard, THE Dashboard SHALL load and display all metrics within 2 seconds
11. WHEN no invoices exist, THE Dashboard SHALL display zero (0) for invoice count, ₹0.00 for all monetary totals, zero (0) for all Payment Status counts, and an empty state message in the recent invoices list
12. IF Dashboard metrics fail to load, THEN THE Dashboard SHALL display an error message indicating the failure and provide a retry option
13. THE Dashboard SHALL adapt its layout for mobile screen sizes (320px to 768px width), tablet screen sizes (768px to 1024px width), and desktop screen sizes (1024px and above)

---

### Requirement 11: Invoice History and Search

**User Story:** As a studio employee, I want to search and filter past invoices, so that I can quickly find specific invoices for reference or modification.

#### Acceptance Criteria

1. THE Invoice_Application SHALL display a searchable list of all invoices sorted by Invoice Date (newest first), showing the following columns: Invoice Number, Customer Name, Event, Event Date, Total Amount, Advance Paid, Balance Due, Payment Status, Created Date, and Last Updated
2. WHEN user enters search text (minimum 1 character), THE Invoice_Application SHALL filter invoices by Invoice Number and Customer Name using case-insensitive partial matching
3. WHEN user clears the search text, THE Invoice_Application SHALL display all invoices matching the current filter criteria
4. THE Invoice_Application SHALL provide filter options for Payment Status with values: All (default), Pending, Partially Paid, and Paid
5. THE Invoice_Application SHALL provide date range filters with "From Date" and "To Date" fields for Invoice Date, where providing only "From Date" filters invoices on or after that date, providing only "To Date" filters invoices on or before that date, and providing both filters invoices within the inclusive date range
6. THE Invoice_Application SHALL display search/filter results within 500 milliseconds
7. THE Invoice_Application SHALL support pagination with 20 invoices per page for lists exceeding 20 items
8. WHEN user clicks on an invoice in the list, THE Invoice_Application SHALL display the full invoice details in view mode showing all invoice data including customer information, services, payment details, and timestamps
9. WHEN viewing an invoice, THE Invoice_Application SHALL provide an "Edit" button that opens the invoice in edit mode allowing modification of customer details, services, and payment information
10. WHEN user clicks the "Duplicate" button for an invoice, THE Invoice_Application SHALL create a new invoice form pre-filled with the selected invoice's customer details, services, and Total Amount, while resetting Invoice Number (obtained from Invoice_Number_Service), Invoice Date (to current date), Due Date (to default offset from current date), and Advance Paid (to zero)
11. THE Invoice_Application SHALL provide "Print" and "Download PDF" buttons for each invoice in the list

---

### Requirement 12: Settings and Configuration

**User Story:** As a studio owner, I want to configure business information and application settings, so that invoices reflect accurate studio details.

#### Acceptance Criteria

1. THE Settings_Manager SHALL store and allow editing of business information: Business Name (maximum 100 characters), Address (maximum 500 characters), Phone Number (10-digit Indian mobile number), Email (valid email format, maximum 254 characters), Instagram Handle (maximum 30 characters, alphanumeric and underscores only)
2. THE Settings_Manager SHALL store and allow upload of the business logo image (PNG or JPG format, maximum 2MB file size, maximum 1024×1024 pixels)
3. IF a logo upload fails due to invalid format, excessive file size, excessive dimensions, or corrupted file, THEN THE Settings_Manager SHALL display an error message indicating the specific validation failure and retain the existing logo
4. THE Settings_Manager SHALL store and allow editing of bank details: Account Name (maximum 100 characters), Bank Name (maximum 100 characters), Account Number (9-18 digits), IFSC Code (11 alphanumeric characters matching pattern: 4 letters followed by 0 followed by 6 alphanumeric characters), UPI ID (valid UPI format: username@provider, maximum 50 characters)
5. THE Settings_Manager SHALL NOT store or display any QR code for payments
6. THE Settings_Manager SHALL store and allow editing of the invoice number prefix (1-10 alphanumeric characters or hyphens, default: "CC-")
7. THE Settings_Manager SHALL store and allow editing of default notes/terms text that appears on invoices (maximum 2000 characters)
8. THE Settings_Manager SHALL store and allow editing of the default due date offset in days (0 to 365 days, default: 15 days)
9. WHEN settings are modified, THE Settings_Manager SHALL synchronize changes to the Cloud_Backend within 5 seconds
10. WHEN settings are updated, THE Settings_Manager SHALL apply the updated settings to all subsequently created invoices starting from the next invoice creation
11. THE Settings_Manager SHALL NOT retroactively modify existing invoices when settings change
12. IF any business information or bank detail field fails validation, THEN THE Settings_Manager SHALL display an error message indicating the specific field and validation requirement, and prevent saving until corrected

---

### Requirement 13: Platform Support - Windows Desktop

**User Story:** As a studio employee using a Windows laptop, I want a desktop application, so that I can use the invoice system without a browser.

#### Acceptance Criteria

1. THE Invoice_Application SHALL be packaged as a Windows executable using Electron
2. THE Invoice_Application SHALL install and run successfully on Windows 10 and Windows 11 operating systems with both 32-bit and 64-bit architectures
3. WHEN the user completes installation using the NSIS installer, THE Invoice_Application SHALL create a desktop shortcut and a Start Menu shortcut named "CandyCapture Photography"
4. THE Invoice_Application SHALL provide both an NSIS installer version and a portable executable version that runs without installation
5. THE Invoice_Application SHALL display the CandyCapture Photography logo as the application icon in the window title bar, Windows taskbar, and desktop shortcut
6. THE Invoice_Application SHALL display the main application window within 5 seconds of launch on a system meeting minimum specifications of 4GB RAM and a dual-core processor
7. WHILE the system has no network connectivity, THE Invoice_Application SHALL allow users to create, view, edit, and delete invoices and customers using locally stored data, and SHALL queue any pending operations for synchronization
8. WHEN network connectivity is restored after an offline period, THE Invoice_Application SHALL automatically synchronize queued operations and display a system tray notification indicating sync completion or failure
9. IF the application fails to launch due to missing dependencies or corrupted files, THEN THE Invoice_Application SHALL display an error message indicating the failure reason and suggesting reinstallation

---

### Requirement 14: Platform Support - Web and Mobile

**User Story:** As a studio owner, I want to access the invoice system from mobile devices, so that I can check invoices and create records on the go.

#### Acceptance Criteria

1. THE Invoice_Application SHALL provide a responsive web interface accessible via the last 2 major released versions of Chrome, Firefox, Safari, and Edge browsers
2. WHILE viewport width is between 320px and 767px (mobile), THE Invoice_Application SHALL display a single-column layout with bottom navigation bar, full-width form fields, and collapsible menu sections
3. WHILE viewport width is between 768px and 1023px (tablet), THE Invoice_Application SHALL display a two-column layout with side navigation drawer, 2-column invoice list, and inline form validation messages
4. WHILE viewport width is 1024px or above (desktop), THE Invoice_Application SHALL display a multi-column layout with fixed side navigation, data tables with sortable columns, and side-by-side invoice preview
5. WHILE viewport width is 767px or below, THE Invoice_Application SHALL render body text at minimum 16px font size and provide touch-friendly controls with minimum tap targets of 44×44 pixels
6. WHILE viewing the invoice list on mobile, THE Invoice_Application SHALL reveal edit and delete action buttons on horizontal swipe of an invoice list item
7. THE Invoice_Application SHALL provide all core functionality (create, view, edit invoices) on mobile devices
8. WHILE viewing PDF preview on mobile, THE Invoice_Application SHALL support pinch-to-zoom with a zoom range of 50% to 300%
9. IF the device orientation changes between portrait and landscape, THEN THE Invoice_Application SHALL reflow the layout within 500 milliseconds without losing form state or scroll position

---

### Requirement 15: Authentication and Security

**User Story:** As a studio owner, I want secure access to my invoice data, so that only authorized users can view or modify business information.

#### Acceptance Criteria

1. THE Cloud_Backend SHALL require user authentication before granting read or write access to any data
2. THE Invoice_Application SHALL provide a login screen requiring username (maximum 254 characters) and password (maximum 128 characters)
3. THE Cloud_Backend SHALL store passwords using bcrypt hashing with minimum 12 rounds
4. THE Cloud_Backend SHALL enforce password requirements: minimum 8 characters, maximum 128 characters, at least one uppercase letter, one lowercase letter, and one number
5. THE Invoice_Application SHALL NOT store credentials in frontend code or local storage in plain text
6. THE Cloud_Backend SHALL use JWT tokens with 24-hour expiration for session management
7. WHEN the JWT token has 5 minutes or less remaining before expiration, THE Invoice_Application SHALL automatically request a new token from the Cloud_Backend
8. WHEN token refresh fails, THE Invoice_Application SHALL redirect to the login screen and display a message indicating the session has expired
9. IF login credentials are invalid, THEN THE Invoice_Application SHALL display an error message indicating authentication failure without revealing whether the username or password was incorrect
10. THE Cloud_Backend SHALL implement rate limiting: maximum 5 failed login attempts per 15 minutes per IP address
11. IF the rate limit is exceeded, THEN THE Cloud_Backend SHALL reject subsequent login attempts from that IP address with a message indicating too many failed attempts and the remaining lockout time in minutes
12. THE Cloud_Backend SHALL log all authentication attempts with timestamp, IP address, and success/failure status, retaining logs for a minimum of 90 days
13. THE Invoice_Application SHALL provide a logout function that clears local tokens, cached data, and redirects to the login screen

---

### Requirement 16: Data Backup and Recovery

**User Story:** As a studio owner, I want to backup my invoice data, so that I can recover from data loss or system failures.

#### Acceptance Criteria

1. THE Cloud_Backend SHALL perform automated daily backups of all data at a configurable time (default: 02:00 local server time)
2. THE Cloud_Backend SHALL retain backups for a minimum of 30 days with automatic deletion of backups older than the retention period
3. THE Settings_Manager SHALL provide an "Export Data" function that downloads all customers, invoices, payment records, services, and settings as a JSON file with filename format "CandyCapture-Backup-{YYYY-MM-DD}.json"
4. THE Settings_Manager SHALL provide an "Import Data" function that restores data from a previously exported JSON file
5. WHEN importing data, THE Invoice_Application SHALL validate data integrity by verifying: JSON structure validity, required fields presence for each record type, data type correctness, and referential integrity between customers and invoices
6. IF data integrity validation fails during import, THEN THE Invoice_Application SHALL display an error message indicating the specific validation failures and abort the import without modifying existing data
7. WHEN importing valid data, THE Invoice_Application SHALL prompt user to choose between "Merge" (add new records, skip duplicates identified by ID) and "Replace" (delete all existing data before importing)
8. IF user selects "Replace" import strategy, THEN THE Invoice_Application SHALL display a confirmation dialog stating that all existing data will be permanently deleted
9. WHEN user confirms a "Replace" import operation, THE Invoice_Application SHALL delete existing data and import the new data as an atomic operation, rolling back to the previous state if import fails
10. THE Export function SHALL exclude sensitive authentication tokens and passwords from exported data
11. THE Export function SHALL complete within 30 seconds for datasets containing up to 10,000 invoices
12. IF export or import operation fails, THEN THE Invoice_Application SHALL display an error message indicating the failure reason and preserve existing data unchanged

---

### Requirement 17: Error Handling and Reliability

**User Story:** As a studio employee, I want the application to handle errors gracefully, so that I don't lose work due to unexpected issues.

#### Acceptance Criteria

1. IF a network request fails (10-second timeout or HTTP error status), THEN THE Invoice_Application SHALL display the failure reason, offer a retry button, and allow up to 3 retry attempts
2. IF the Cloud_Backend is unreachable for more than 5 seconds, THEN THE Invoice_Application SHALL switch to offline mode automatically and display a visible offline status indicator
3. WHILE an invoice form is being edited, THE Invoice_Application SHALL auto-save all form field values to local browser storage every 30 seconds
4. IF the application restarts after a crash during invoice creation and an auto-saved draft exists that is less than 24 hours old, THEN THE Invoice_Application SHALL offer the user a choice to restore the draft or discard it
5. IF an unexpected error occurs, THEN THE Invoice_Application SHALL display a fallback screen with options to reload the page or return to dashboard
6. WHEN an unexpected error occurs, THE Invoice_Application SHALL log error details including error type, message, component stack trace, and timestamp to the Cloud_Backend for debugging
7. THE Invoice_Application SHALL provide a "Report Issue" button in the main navigation that sends error logs (up to 1MB) to support
8. WHILE in offline mode, THE Invoice_Application SHALL disable features that require server connectivity (such as invoice number generation and data export) and display a message indicating the feature is unavailable offline

---

### Requirement 18: Sample Data and Testing Support

**User Story:** As a developer or tester, I want sample data for testing, so that I can verify the application works correctly.

#### Acceptance Criteria

1. THE Invoice_Application SHALL provide a "Demo Mode" toggle or button on the main screen that, when activated, loads pre-populated sample data
2. WHILE Demo Mode is active, THE Invoice_Application SHALL display a persistent visual indicator (such as a banner or badge with the text "DEMO MODE") that remains visible across all screens
3. THE sample data SHALL include at least one customer: Name "Bala", Mobile "9500440272"
4. THE sample data SHALL include at least one invoice with:
   - Customer: Bala
   - Event: Wedding
   - Event Date: 20-Nov-2026
   - Location: Sivakasi Paper Associate
   - Services: Traditional Photo, Traditional Video, Candid Photo, Candid Video, Pen Drive + Hard Disk, Photo Frames, Teaser, E-Invite, Traditional Film, Post-Wedding (10 services total)
   - Total Amount: ₹1,20,000
   - Advance Paid: ₹20,000
   - Balance Due: ₹1,00,000
   - Status: PARTIALLY_PAID
   - Invoice Number: CC-1001
5. WHILE Demo Mode is active, THE Invoice_Application SHALL store demo data in a separate storage location from production data, preventing any modification to production records
6. THE Invoice_Application SHALL provide a "Clear Demo Data" button that is only visible while Demo Mode is active
7. WHEN the user activates the "Clear Demo Data" function, THE Invoice_Application SHALL display a confirmation dialog requiring explicit user approval before deletion
8. WHEN the user confirms demo data clearing, THE Invoice_Application SHALL remove all demo customers and invoices and return the application to its initial state with an empty customer and invoice list

---

### Requirement 19: Performance Requirements

**User Story:** As a studio employee, I want the application to respond quickly, so that I can serve customers efficiently.

#### Acceptance Criteria

1. THE Invoice_Application SHALL load the main dashboard within 3 seconds on a device with 4GB RAM and 10 Mbps download speed
2. WHEN user completes typing in a search field, THE Invoice_Application SHALL render search results within 500 milliseconds from final keystroke to first result display
3. WHEN user requests PDF generation, THE PDF_Generator SHALL generate an invoice PDF containing up to 50 line items within 3 seconds
4. WHEN user saves a record, THE Sync_Engine SHALL complete synchronization of that single record within 5 seconds
5. WHILE the database contains up to 10,000 customers, THE Invoice_Application SHALL maintain the time thresholds defined in criteria 1 and 2
6. WHILE the database contains up to 50,000 invoices, THE Invoice_Application SHALL maintain the time thresholds defined in criteria 1 and 2
7. WHILE up to 100 users are connected concurrently, THE Cloud_Backend SHALL maintain the time thresholds defined in criteria 1, 2, 3, and 4

---

### Requirement 20: Deliverables and Documentation

**User Story:** As a studio owner receiving the application, I want complete documentation and deliverables, so that I can deploy and maintain the system.

#### Acceptance Criteria

1. THE development team SHALL deliver a Windows executable installer file that installs the application on Windows 10 or later
2. THE development team SHALL deliver a portable Windows executable file that runs without installation on Windows 10 or later
3. THE development team SHALL deliver source code in a Git repository that can be built into a working application using the documented build commands
4. THE Git repository SHALL NOT contain any secrets, passwords, or API keys in any committed files
5. THE development team SHALL deliver a README file containing prerequisite software requirements, installation steps, build commands, and deployment instructions
6. THE development team SHALL deliver Cloud_Backend deployment documentation containing infrastructure setup steps, environment variable configuration, and service deployment commands
7. THE development team SHALL deliver environment configuration templates with all required variables documented with descriptions and example values
8. THE README file SHALL include instructions for configuring the business logo and branding elements
9. WHEN user provides a GitHub personal access token with repository write permissions, THE development team SHALL push the repository to the user's specified GitHub account
