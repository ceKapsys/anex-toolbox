# CHANGELOG

All notable changes to ANEX App are documented in this file.

## [3.9.5] - 2026-02-23

### Fixed
- **Quotation Title Styling**: Added 15px margin-top and margin-bottom to "QUOTATION" title
  - Improved visual spacing in PDF output
- **Quotation Validity Date**: Fixed missing validity date in downloaded PDF
  - Auto-calculates 30-day validity from quotation date if not present
- **Quotation Number Auto-generation**: Improves fallback generation for missing quotation numbers
  - Ensures quotation number is always present in PDF

## [3.6.1] - 2026-02-23

### Fixed
- **Quotation Edit Functionality**: Fixed edit button not loading existing quotations
  - Added support for loading quotations by ID from query parameters
  - Implemented update logic in QuotationGenerator for editing existing quotations
  - Store now properly redirects to quotations list after saving

## [3.6.0] - 2026-02-12

### Major Changes
- **Complete Database Overhaul**: Fixed critical database schema issues affecting stability
  - Removed duplicate column definitions that caused SQLITE_ERROR
  - Improved database initialization with proper error handling
  - Enhanced migration strategy for future updates

- **Comprehensive Backup & Restore System**: 
  - New automated backup utility with timestamped snapshots
  - One-click restore capability from any previous state
  - Database integrity verification tool
  - Pre-restore automatic backups to prevent data loss

- **Improved Application Reliability**:
  - Fixed admin user auto-seeding on startup
  - Better settings loading with robust JSON parsing
  - Enhanced error handling across database operations
  - Added detailed recovery documentation

### Fixed
- **Database Schema**: Removed duplicate `work_order_number` column definition in quotations table
- **Admin User Auto-seeding**: Improved initialization to safely create default admin user without errors
- **Settings Page**: Enhanced JSON parsing for settings values handling both string and object formats
  - Better `smtp_config` object handling vs individual SMTP fields
  - Proper type checking and fallback defaults for all settings
- **CORS Issues**: Resolved backend connection problems through database stability improvements

### Added
- **Database Backup & Restore Utility** (`scripts/backup.js`):
  - `node backup.js backup` - Create timestamped database backups
  - `node backup.js list` - View all available backups with file sizes
  - `node backup.js restore <filename>` - Restore from any previous backup
  - `node backup.js verify` - Check database integrity and table status
  - Automatic pre-restore backups to prevent data loss
- **Database Recovery Guide** (`DATABASE_RESTORE_GUIDE.md`):
  - Complete instructions for backup and restore procedures
  - Recommended backup strategies and automation tips
  - Troubleshooting guide for common database issues
- **Backup Directory**: New `server/backups/` directory for automatic backup storage

### Improved
- **Database Initialization**: More robust table creation with proper error handling for migrations
- **Error Messages**: Better logging of database operations for debugging
- **Recovery Process**: One-click restore from any previous backup state
- **Application Stability**: Fixed critical issues preventing login and data access

## [3.5.1] - 2026-02-12

### Fixed
- **Database Schema**: Removed duplicate `work_order_number` column definition in quotations table that was causing SQLITE_ERROR.
- **Admin User Auto-seeding**: Improved database initialization to safely create default admin user on startup without errors.
- **Settings Page**: Enhanced JSON parsing for settings values to handle both string and object formats properly.
  - Better handling of `smtp_config` object vs individual SMTP fields
  - Proper type checking and fallback defaults for all settings

### Added
- **Database Backup & Restore Utility** (`scripts/backup.js`):
  - `node backup.js backup` - Create timestamped database backups
  - `node backup.js list` - View all available backups with file sizes
  - `node backup.js restore <filename>` - Restore from any previous backup
  - `node backup.js verify` - Check database integrity and table status
  - Automatic pre-restore backups to prevent data loss
- **Database Recovery Guide** (`DATABASE_RESTORE_GUIDE.md`):
  - Complete instructions for backup and restore procedures
  - Recommended backup strategies and automation tips
  - Troubleshooting guide for common database issues
- **Backup Directory**: New `server/backups/` directory for automatic backup storage

### Improved
- **Database Initialization**: More robust table creation with proper error handling for migrations
- **Error Messages**: Better logging of database operations for debugging
- **Recovery Process**: One-click restore from any previous backup state

## [3.5.0] - 2026-02-12

### Added
- **SMTP Email System**: Implemented complete email sending functionality using Nodemailer.
  - Support for Microsoft 365, Office 365, and standard SMTP servers.
  - Send invoices directly to clients via email with customizable subject and body.
  - Send quotations directly to clients via email with customizable subject and body.
- **SendMailModal Component**: New modal for composing and sending emails.
  - Auto-populated recipient email from client database.
  - CC email field for additional recipients.
  - Customizable subject line.
  - Rich HTML body editor with formatting support.
  - Email validation with clear error messages.
- **Settings Page - Mail Configuration**:
  - New section for SMTP configuration (Microsoft 365 / SMTP).
  - Fields: From Name, From Email, SMTP Host, SMTP Port, Username, Password.
  - Test SMTP Connection button to validate settings before saving.
  - Helpful hints for Microsoft 365 setup and 2FA app passwords.
- **Email Routes** (`/api/email`):
  - `POST /send-invoice`: Send invoice with custom email body and attachments.
  - `POST /send-quotation`: Send quotation with custom email body and attachments.
  - `POST /test-smtp`: Test SMTP connection validity.
- **Invoice & Quotation Lists**:
  - "Send" button on each document card opens email modal.
  - Document status automatically updates to "Sent" after successful delivery.

### Changed
- **InvoicesList**: Send button now opens SendMailModal instead of changing status directly.
- **QuotationsList**: Send button now opens SendMailModal instead of changing status directly.
- **API Module**: Added email client methods to api.js for frontend integration.

### Dependencies
- Added: `nodemailer` (^1.7.6) for SMTP email sending.

## [3.4.7] - 2026-02-12

### Changed
- **Border Styling**: Reduced all card borders from 2px to 1px (border instead of border-2).
- **Card Color**: Updated all cards across the app to use red borders (border-red-500).
- **Dashboard**: Added red 1px borders to Quick Action Cards (Last Quotation, Last Invoice, Last Client).
- **Dashboard**: Added red 1px borders to StatCard components.
- **InvoicesList**: Changed card borders from slate-200 to red-500.
- **Analytics**: Updated all section and card borders to red-500.
  - Service Demand Chart card
  - Most Quoted Clients Chart card
  - Payment Timeliness Section
  - Invoice Metrics cards (VAT Deducted, AIT Deducted, COGS)

## [3.4.6] - 2026-02-12

### Changed
- **Card Borders**: Added red 2px borders to all quotation cards and stat cards.
- **Card Alignment**: Fixed alignment and spacing for better visual consistency.
- **StatCard Layout**: Implemented flex column layout with proper spacing.
- **Action Buttons**: Updated to flex-wrap with centered text and equal width distribution.
- **Responsive Design**: Improved responsive behavior for details section on mobile devices.

## [3.4.5] - 2026-02-12

### Added
- **Work Order Modal**: Modal popup when marking quotations as "Passed" to input Work Order Number.
- **Work Order in Quotations**: Store work_order_number with quotation when passed.
- **Work Order in Invoices**: New input field in invoice editor to select/enter Work Order Number.
- **Invoice Template**: Display Work Order Number in the Invoice Information table.

### Changed
- **Quotations Table**: Added work_order_number column to store work order references.
- **Invoice Data**: Added work_order_ref field to invoice data structure.

## [3.4.4] - 2026-02-12

### Changed
- **Quotation Number Format**: Updated to use 4-digit alphanumeric codes instead of 3-digit.
- **Example Format**: `AQB-DES-3-A7K9` (Service code, Month, 4-digit random alphanumeric).

## [3.4.3] - 2026-02-12

### Changed
- **Quotation Number Format**: Updated to `AQB-{ServiceCode}-{Month}-{3-digit alphanumeric}`.
- **Random Code**: Quotation numbers now use random 3-character alphanumeric codes (A-Z, 0-9).
- **Simplified Logic**: Removed complex day-based suffix and maxRand tracking for cleaner generation.

## [3.4.2] - 2026-02-12

### Added
- **Working Day Calculation**: Invoice due dates now automatically calculate 7 working days from issue date.
- **Bangladesh Holidays**: Added 2026 government holidays list (Independence Day, Victory Day, Eid, etc.).
- **Weekend Support**: Friday and Saturday are recognized as weekends for Bangladesh work week.

### Changed
- **Due Date Field**: Made invoice due date field read-only/non-editable in the editor.
- **Auto-Calculate**: Due date automatically updates when issue date changes.
- **Business Logic**: Due date skips weekends (Friday/Saturday) and government holidays when counting working days.

## [3.4.1] - 2026-02-11

### Fixed
- **Invoice List Metrics**: Fixed calculation logic for invoice statistics.
- **Total Receivables**: Now correctly shows total amount from all invoices in current month.
- **Payment Pending**: Now calculated as Total Receivables - Total Received.
- **Invoice Counts**: Fixed filters for VAT Deducted and AIT Deducted counts to handle null values.

### Changed
- **Invoice Metrics**: All metrics now calculate based on current month data (matching Dashboard all-time vs list current-month requirement).

## [3.4.0] - 2026-02-11

### Added
- **Authentication**: Full admin login and authorization system with session management.
- **Security**: Protected all POST, PUT, DELETE API routes with authentication middleware.
- **User Management**: Admin users table with bcrypt password hashing.
- **Session Management**: 24-hour session expiry with automatic cleanup.
- **Login Page**: Beautiful login UI with error handling and loading states.
- **Logout**: Logout button in sidebar with user info display.

### Changed
- **Dashboard**: Renamed "Total VAT" to "Deducted VAT" and "Total AIT" to "Deducted AIT".
- **Dashboard**: Removed duplicate VDS and TDS cards (consolidated with VAT/AIT deductions).
- **Dashboard**: Stats cards now use full row width (2 columns instead of 4).
- **Dashboard**: Removed transaction history section for cleaner layout.
- **Dashboard**: Fixed last invoice display to show client name from client_snapshot.
- **Dashboard**: Improved date sorting for last invoice and quotation.
- **Quotations**: Added DELETE route for quotation removal.
- **API**: All API calls now automatically include session ID in headers.

### Fixed
- **Clients**: Fixed "no such column: client_code" error by properly adding column to database.
- **Invoice Totals**: Added grand_total to totals_data for accurate calculations.
- **Dashboard Stats**: VDS and TDS now properly calculated from invoice data.
- **Payment Metrics**: Payment pending now correctly calculated as (Receivables - Received).
- **Quotation Delete**: Quotation deletion now working correctly with proper API route.

### Security
- Default admin credentials: username: `admin`, password: `admin123` (change after first login)
- All data modification routes require valid session authentication
- Automatic redirect to login page on unauthorized access

## [1.3.1] - 2026-02-09

### Changed
- **Invoice Template**: Buyer BIN automatically populated from selected client's BIN number.
- **Invoice Template**: Buyer Information and Invoice Information boxes now have equal widths.
- **Invoice Template**: All section body labels now left-aligned instead of centered.
- **Invoice Template**: Payment Method section now has white background (no dark styling) except for the title.
- **Invoice Template**: Disclaimer text now loaded from Settings > Invoice Disclaimer.

### Fixed
- **Clients**: Auto-migration now generates client_code for existing clients on page load.

## [1.3.0] - 2026-02-09

### Added
- **Analytics**: Time filters for Month, Quarter, and Year selection.
- **Analytics**: Client and Service filter dropdowns.
- **Analytics**: Service Demand bar chart showing most requested services.
- **Analytics**: Most Quoted Clients bar chart with quote counts and amounts.
- **Analytics**: On-Time Payment metrics (payments made within 30 days of invoice).
- **Analytics**: Payment Timeliness section showing on-time rate, on-time count, and late payments.

### Changed
- **Analytics**: Invoice metrics now show 5 cards including On-Time Payments.
- **Analytics**: All data is now filtered by selected time period, client, and service.

## [1.2.9] - 2026-02-09

### Added
- **Analytics**: New Analytics page with invoice and quotation performance metrics.
- **Navigation**: Added Analytics menu item in sidebar.

### Changed
- **Clients**: Clients now sorted alphabetically by name.
- **Invoice List**: Updated stats cards to show: Total Receivables, Payment Pending, Total Received, VAT Deducted, AIT Deducted.
- **Invoice List**: Removed "(This Month)" from stats card labels.
- **Quotations List**: Removed "(This Month)" from stats card labels.

## [1.2.8] - 2026-02-09

### Changed
- **Invoice List**: Redesigned to card-based layout matching quotation list design.
- **Invoice List**: Added filter tabs (All, Draft, Submitted, Paid) and search box.
- **Invoice List**: Cards show invoice title, reference, status badge, issue date, amount, and actions.
- **Invoice List**: Stat cards now show Total, Receivables, and Received with counts and amounts.

## [1.2.7] - 2026-02-09

### Added
- **Quotation Generator**: Added "Back to Quotations" navigation link in editor header.
- **Invoice Generator**: Added "Back to Invoices" navigation link at top of page.

### Changed
- **Clients**: Full-width layout for form (top) and client list (below).
- **Clients**: Table now shows Client ID, Name, Contact Person, Phone, Total Quotations, and Passed count.
- **Clients**: Client ID now uses random alphanumeric format (e.g., A7X3K9) instead of sequential.
- **Quotations List**: Redesigned to card-based layout matching new design.
- **Quotations List**: Added filter tabs (All, In Process, Sent, Passed, Rejected) and search box.
- **Quotations List**: Cards show quote title, reference, status badge, created date, total, and actions.

### Removed
- **Quotations List**: Removed Duplicate and View buttons from quotation cards.

## [1.2.6] - 2026-02-09

### Added
- **Clients**: Auto-generated unique 6-digit Client ID (e.g., A10001) based on first letter of client name.
- **Clients**: BIN (Business Identification Number) field added to client form.
- **Clients**: Duplicate client name validation to prevent adding clients with the same name.

### Changed
- **Clients**: Updated form fields to include: Client Name (required), Address (required), BIN, Contact Person (required), Email, Phone.
- **Clients**: Client list table now shows Client Code, Name, BIN, Contact, and Phone columns.

## [1.2.5] - 2026-02-09

### Changed
- **Invoice List**: All metrics now filtered to show current calendar month data only.
- **Invoice List**: Updated labels to indicate "(This Month)" for all metric cards.
- **Invoice List**: VDS and TDS deducted amounts now correctly pulled from invoice payment data.

## [1.2.4] - 2026-02-09

### Added
- **Dashboard**: Added 3 quick action cards (Last Quotation, Last Invoice, Last Client) with dynamic data and CTAs.

### Removed
- **Dashboard**: Removed "Upgrade to Pro" promotional card from sidebar.

## [1.2.3] - 2026-02-09

### Changed
- **Quotations List**: Moved "Quotation Performance (This Month)" metrics from Dashboard to Quotations List page.
- **Dashboard**: Removed "This Month" quotation metrics cards; retained "Quotation Performance (Monthly)" chart.

## [1.2.2] - 2026-02-09

### Changed
- **Branding**: Renamed application title to "Anex Tools".

## [1.2.1] - 2026-02-08

### Fixed
- **Dashboard**: Fixed `ReferenceError: balanceData is not defined` by restoring missing mock data variables required for the chart component.
- **Dashboard**: Fixed `ReferenceError: useEffect is not defined` by adding missing React import.

## [1.2.0] - 2026-02-08

### Added
- **Dashboard Metrics**: Implemented real-time dashboard metrics (Total Receivables, VAT, AIT, etc.) fetching from invoice data.
- **Currency Update**: Changed default currency symbol from `$` to `Tk` (BDT) across the dashboard and invoice list.

### Fixed
- **PDF Generation**: Resolved critical `oklch` color error by downgrading Tailwind to v3 and enforcing legacy color support.
- **Design Regression**: Fixed UI breakage caused by Tailwind downgrade by correcting `postcss` and `index.css` configuration.
- **Invoice Visibility**: Fixed issue where invoices were not loading in the list due to incorrect API response handling.

## [1.1.0] - 2026-02-08

### Added
- **PDF Download Feature for Invoices**: Users can now download generated invoices as PDF files with the same template and formatting as the preview. Download button available in the Invoice Preview panel.
- **PDF Download Feature for Quotations**: Users can now download generated quotations as PDF files with the same template and formatting as the preview. Download button available in the Quotation Editor panel.
- **High-Quality PDF Generation**: Optimized HTML-to-PDF conversion using html2pdf.js with:
  - 2x scale for better text quality
  - Cross-origin image support for logos and headers
  - A4 portrait format matching preview layout
  - Automatic filename generation based on invoice/quotation number

### Technical Details
- PDF generation utility (`pdfGenerator.js`) handles conversion of React components to downloadable PDF files
- Invoice PDF download: Uses `InvoiceTemplate` component with full Mushak 6.3 compliance formatting
- Quotation PDF download: Uses `QuotationTemplate` component with header/footer support
- Download buttons integrated into:
  - `InvoicePreview.jsx`: Download button in preview header
  - `QuotationGenerator.jsx`: Download button in live preview section

### Files Modified/Created
- `client/src/utils/pdfGenerator.js` - Core PDF generation utility
- `client/src/components/invoice/InvoicePreview.jsx` - Added download button for invoices
- `client/src/pages/QuotationGenerator.jsx` - Added download button for quotations

## [1.0.0] - 2026-01-XX

### Initial Release
- Invoice generation with Mushak 6.3 compliance
- Quotation generation
- Client management
- Service type management
- Terms and conditions management
- Payment tracking
- Settings and configuration
- Bank details management
