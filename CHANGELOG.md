# CHANGELOG

All notable changes to ANEX App are documented in this file.

## [3.14.0] - 2026-05-05

### Added
- **Backup & Restore page** (`/backup`): New dedicated page with export and import panels for invoices and quotations
- **JSON backup export**: `GET /api/backup/invoices` and `GET /api/backup/quotations` — download all records as a dated JSON file via `Content-Disposition` attachment
- **JSON backup restore**: `POST /api/backup/invoices/restore` and `POST /api/backup/quotations/restore` — upload a JSON backup to re-import records; existing records (matched by `invoice_no` / `quotation_number`) are automatically skipped to prevent duplicates
- **`downloadBackup` API helper** (`api.js`): Fetch-based helper that reads `Content-Disposition` filename, converts the response to a Blob, and triggers a browser save dialog without losing the auth cookie
- **`BackupPanel` UI component**: Self-contained panel with download section, drag-and-drop-style file picker, import button, and clear button; supports blue (invoices) and emerald (quotations) colour variants
- **`ResultBanner` UI component**: Inline success/error banner showing imported/skipped counts and per-record error details (up to 10 shown)
- **Backup nav item**: "Backup" entry (HardDrive icon) added to the sidebar between Analytics and Settings

### Fixed
- **`border-red-500` debug borders removed**: All leftover red debug borders replaced with `border-slate-100` across Dashboard quick-action cards, `StatCard` components, InvoicesList cards, QuotationsList cards, and Analytics section cards
- **Dashboard hardcoded user info**: "Admin User" / "AB" placeholder replaced with real name/initials/email pulled from `useAuth()`; non-functional search bar removed from the header
- **`'In Process'` status rejected (400)**: Added `'In Process'` to `VALID_QUOTATION_STATUSES` on the backend — selecting this status from the QuotationsList dropdown previously returned a silent HTTP 400 error
- **Terms & Services missing required-field validation**: `POST` and `PATCH` routes for `/api/terms` and `/api/services` now return HTTP 400 when `name` (terms) or `name`/`shortcode` (services) are blank
- **`updated_at` not refreshed on invoice status/payment changes**: `PATCH /api/invoices/:id/status` and `PATCH /api/invoices/:id/payment` now set `updated_at: new Date()` so records reflect when they were last modified
- **`updated_at` not set after email send**: `send-invoice` and `send-quotation` email routes now include `updated_at: new Date()` when updating the document status to `'Sent'`
- **`handleSendEmail` crash when settings unloaded**: Added null guard (`if (!settings) throw new Error(...)`) matching the existing guard on `handleDownload`; prevents a crash on page load race condition
- **`alert()` popups replaced with toast notifications**: Success and error feedback in InvoicesList and QuotationsList now uses a non-blocking bottom-right toast instead of `window.alert()`

### Security
- **Removed `x-session-id` header fallback**: `isAuthenticated` middleware previously accepted the session token via either the httpOnly cookie or an `x-session-id` request header; the header path is JS-accessible and defeats cookie isolation. No code in the codebase sends that header, so the fallback has been removed
- **Server-side email address validation**: `POST /api/email/send-invoice` and `POST /api/email/send-quotation` now validate `to` and `cc` with a regex check and return HTTP 400 for malformed addresses before attempting SMTP delivery

### Schema
- **`Quotation.updated_at` field added**: The `Quotation` model was missing `updated_at` (unlike `Invoice`); added as `DateTime @default(now())`
- **Database indexes added**: `@@index([name])` on `Client`; `@@index([client_id])`, `@@index([status])`, `@@index([issue_date])` on `Invoice`; `@@index([client_id])`, `@@index([status])`, `@@index([date])` on `Quotation` — reduces query time on all heavily filtered list endpoints

## [3.13.2] - 2026-04-28

### Fixed
- **Quotation PDF header/footer images missing**: `toDataUrl` in
  `quotationPdfMake.js` did not strip surrounding quotes from values that were
  double-JSON-encoded when stored in settings (e.g. `'"data:image/png;..."'`).
  The leading `"` caused `url.startsWith('data:')` to return false, so the
  image was silently skipped. Added `normalizeAssetValue()` (identical to the
  one already used in `invoicePdfMake.js`) and applied it before every
  `toDataUrl` call, including the timeout fallback path.

### Changed
- **Quotation PDF item table column widths**: Narrowed the Qty (43→28),
  Unit (53→38), and Price (69→55) columns so the Item description column
  receives proportionally more of the available page width, reducing text
  overflow and wrapping in item titles.

## [3.13.1] - 2026-04-28

### Fixed
- **PDF download slow / frozen UI**: Resolved three combined causes that made
  every invoice and quotation download take 1–5+ seconds with no visible
  progress:

  1. **`JSON.stringify(data)` cache key** — Both `invoicePdfMake.js` and
     `quotationPdfMake.js` used `JSON.stringify(data)` as the in-memory cache
     key. The `data` object contains `company_logo`, `bank_details.logo`,
     `header_image`, and `footer_image` as base64 strings (potentially several
     hundred KB each). Serialising these strings synchronously blocked the
     JavaScript main thread for 1–3 s every time a download button was clicked,
     before PDF generation had even started. Replaced with a cheap pipe-delimited
     key built from a handful of scalar fields (invoice/quotation number, dates,
     totals, item count).

  2. **No yield to renderer** — `setGenerating(true)` was called immediately
     before the heavy computation, but the browser never got a chance to commit
     the render and show the "Generating…" spinner because the main thread was
     blocked. Added `await yieldToMain()` (a `setTimeout(0)` microtask break) at
     the start of both `buildInvoicePDFBlob` and `buildQuotationPDFBlob` so the
     spinner renders before pdfmake starts its layout pass.

  3. **No timeout on quotation PDF / 90s invoice timeout** — The quotation PDF
     generator had no timeout at all; if pdfmake's `getBlob` callback stalled
     the download would hang indefinitely. The invoice PDF had a 90-second
     timeout. Both are now 20 seconds with a graceful fallback to
     `pdfMake.createPdf(docDef).download()` if the promise-based `getBlob`
     path times out.

- **Quotation image fetch missing credentials** — `toDataUrl` in
  `quotationPdfMake.js` did not pass `credentials: 'include'` to `fetch`,
  unlike the invoice equivalent. Fixed for consistency; ensures assets served
  via authenticated endpoints load correctly.

## [3.13.0] - 2026-04-28

### Security
- **Auth — httpOnly cookie now primary transport**: `AuthContext` always calls
  `/api/auth/verify` on page load so the httpOnly session cookie is checked even
  when no `sessionId` is present in `localStorage`. Previously, if no
  `localStorage` entry existed the check was skipped entirely, leaving a valid
  cookie session invisible to the app.
- **Session token removed from login response body**: The server no longer
  returns `sessionId` in the login JSON response. Returning it in the body
  allowed JavaScript (and any XSS payload) to read the token, defeating the
  httpOnly protection. The session is now carried exclusively by the httpOnly
  cookie.
- **localStorage sessionId removed from frontend**: `AuthContext` and `api.js`
  no longer read or write `sessionId` to `localStorage`. All authenticated
  requests rely on `credentials: 'include'` so the browser attaches the httpOnly
  cookie automatically.
- **Email HTML sanitization hardened**: The outbound email sanitizer previously
  only stripped `<script>` tags. It now also strips `<style>`, `<iframe>`,
  `<object>`, `<form>`, `<embed>`, `<link>`, `<meta>`, and `<base>` tags;
  removes all inline `on*` event handler attributes; and disarms `javascript:`
  URIs in `href`/`src`/`action` attributes.
- **Invoice status enum validation**: `POST /api/invoices`, `PATCH /api/invoices/:id`,
  `PATCH /api/invoices/:id/status`, and `PATCH /api/invoices/:id/payment` now
  reject any `status` value not in the whitelist
  `{Draft, Sent, Submitted, Paid, Overdue, Cancelled}` with a 400 error.
- **Quotation status enum validation**: `POST /api/quotations` and
  `PUT /api/quotations/:id` now validate `status` against
  `{Draft, Sent, Passed, Rejected, Cancelled}`.
- **Payment update strips undefined fields**: `PATCH /api/invoices/:id/payment`
  previously spread all six fields unconditionally, which could overwrite stored
  values with `undefined` in partial updates. It now only includes fields that
  were explicitly provided in the request body.

### Fixed
- **Quotation error logging**: `POST /api/quotations` and `PUT /api/quotations/:id`
  error handlers previously called `console.error('Quotation Create/Update Error')`
  without attaching the error object. They now log `err.message` for
  actionable server-side diagnostics.
- **Dashboard StatCard color fallback**: `StatCard` color map only contained
  `blue`, `green`, and `red`. Cards rendered with `color="orange"` or
  `color="purple"` silently fell back to blue. Orange, amber, and purple
  variants are now defined so the Payment Pending (orange) and Deducted AIT
  (purple) cards render with their intended colours.
- **Settings duplicate message banner**: The SMTP section rendered a second
  `{message}` banner below the section header in addition to the top-of-page
  banner, causing save/error notices to appear twice. The duplicate has been
  removed.
- **Invoice due-date holiday lookup applied to wrong year**: `calculateDueDate`
  in `useInvoice.js` looked up holidays from a single `bangladeshHolidays2026`
  array regardless of the candidate date's year. For 2027+ invoices no holidays
  were matched (array keys are 2026-only strings). Holidays are now stored in a
  `bangladeshHolidaysByYear` map and the correct year's list is used for each
  candidate date. 2027 fixed holidays added; Eid dates to be added once
  confirmed against the lunar calendar.
- **Analytics year filter capped at 2026**: The year dropdown was hardcoded to
  `[2024, 2025, 2026]`. It now computes dynamically as
  `[currentYear - 2, currentYear - 1, currentYear, currentYear + 1]` so
  it stays current without yearly manual edits.

## [3.12.6] - 2026-03-11

### Fixed
- **Dashboard Crash on Login**: Fixed framer-motion `motion.div` import issue that caused a blank page after login

## [3.12.2] - 2026-03-08

### Fixed
- **QuotationGenerator race condition**: Settings (header image, footer image, disclaimer, signatories) now load before quotation data so they are never overwritten with empty values when editing an existing quotation
- **Contact details in Generator**: Existing quotation's `contact_name` is matched against signatories to populate full details (designation, phone, email)

## [3.12.1] - 2026-03-08

### Fixed
- **Quotation PDF summary alignment**: Summary table label column now uses auto-width (`'*'`) so it stays within its allocated space and right edge aligns exactly with the items table
- **Quotation PDF footer space**: Removed footer callback approach; disclaimer and footer image are now inline content with `pageMargins: [0,0,0,0]`, eliminating all whitespace after the footer

## [3.12.0] - 2026-03-05

### Security
- **Helmet**: Added security headers (X-Content-Type-Options, X-Frame-Options, HSTS, CSP, etc.)
- **Rate Limiting**: Global rate limiter (500 req/15min) and strict auth limiter (20 req/15min) on login
- **httpOnly Cookies**: Session IDs now stored in httpOnly cookies with secure/sameSite flags, falling back to x-session-id header for backward compatibility
- **Authenticated GET Routes**: All data-fetching endpoints (clients, invoices, quotations, settings, services, terms) now require authentication
- **SMTP Password Masking**: Settings GET endpoint masks smtp_config.password in responses
- **Seed Endpoint Protected**: `/api/auth/seed` now requires SEED_SECRET env var; credentials read from SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD env vars
- **Hardcoded Credentials Removed**: Removed all plaintext passwords from source code, scripts, and documentation
- **Password Policy**: Change-password now requires 8+ chars with uppercase, lowercase, number, and special character
- **Session Fixation Prevention**: Old sessions invalidated on new login
- **Error Message Sanitization**: All API error responses return generic messages; raw errors logged server-side only
- **Health Endpoint Hardened**: Removed DATABASE_URL and NODE_ENV leakage from /api/health
- **Email HTML Sanitization**: Script tags stripped from email body HTML before sending
- **File Upload Validation**: Multer now only accepts PDF files (application/pdf)
- **Body Parser Limit Reduced**: JSON body limit reduced from 50MB to 10MB
- **CORS Hardened**: Dynamic origin validation instead of static array
- **ID Validation**: BaseRepository now validates numeric IDs, rejecting NaN
- **bcrypt Rounds Increased**: Hashing rounds increased from 10 to 12

### Changed
- **Vite Dev Proxy**: Added /api proxy to localhost:5000 for seamless cookie-based dev
- **Client Auth**: AuthContext and api.js now send credentials: 'include' for cookie support

### Removed
- **express-session**: Removed unused dependency

### Environment Variables Required
- `SEED_SECRET` — Secret for seed endpoint authorization
- `SEED_ADMIN_EMAIL` — Admin email for seed
- `SEED_ADMIN_PASSWORD` — Admin password for seed
- `SEED_ADMIN_NAME` — Admin display name for seed (optional)

## [3.11.6] - 2026-03-01

### Fixed
- **Send Mail Page Freeze**: Emails with PDF attachments no longer freeze the page
  - Switched from base64-in-JSON to multipart FormData file upload for PDF attachments
  - PDFs are generated as Blobs (not base64 strings) on the client, avoiding expensive synchronous conversion
  - Server now uses `multer` to parse multipart uploads, receiving PDFs as binary buffers
  - Added `requestFormData` helper to API client for multipart requests

### Dependencies
- Added: `multer` for server-side multipart form data parsing

## [3.11.5] - 2026-03-01

### Fixed
- **Email PDF Attachments**: Invoice and quotation PDFs are now attached when sending via the Send Mail button
  - Added `getInvoicePDFBase64` and `getQuotationPDFBase64` utility functions to generate PDFs as base64 strings
  - Updated `InvoicesList` and `QuotationsList` send email handlers to generate the PDF and pass `pdf_data` to the email API
  - Previously emails were sent without any PDF attachment

## [3.11.4] - 2026-03-01

### Fixed
- **Invoice PDF Header**: Changed "NATIONAL BOARD OF REVENUE (TAX INVOICE)" to "NATIONAL BOARD OF REVENUE (NBR)" and ensured center alignment of header text and TAX INVOICE label
- **Invoice PDF Spacing**: Added proper margins between all major sections — page top, header, Registered Business Info, Buyer/Invoice info, Total in Words, and math row (Net/VAT/Adjustment/Due)
- **Invoice PDF Table Width**: Reduced items table column widths so the table never exceeds the Registered Business Info box width

## [3.11.3] - 2026-02-24

### Fixed
- **Quotation PDF summary alignment**: Subtotal, VAT, and Total rows now use the same font size and styling
- **Contact details missing in PDF**: Download from quotation list now looks up the matching signatory from settings to show full contact details (designation, phone, email)
- **Footer bottom spacing**: Removed bottom margin from terms/contact grid so there is no gap before the footer

## [3.11.2] - 2026-02-24

### Fixed
- **Quotation PDF layout**: Footer image and disclaimer now stick to the bottom of the page with no bottom margin (using pdfmake footer callback)
- **Quotation PDF alignment**: Items table, info box, and terms/contact boxes now render at exactly the same width (Item column uses auto-fill) and are centered consistently

## [3.11.1] - 2026-02-24

### Fixed
- **Quotation pages broken**: Removed unused `noBorderLayout` constant from `quotationPdfMake.js` that triggered ESLint `no-unused-vars: error` build failure, causing all quotation pages to fail to load

## [3.11.0] - 2026-02-24

### Added
- **`quotationPdfMake.js`**: New pdfmake-based quotation PDF generator replicating the full QuotationTemplate design — header image, QUOTATION title, two-column info box (client + reference), items table with dark-teal header and alternating rows, right-aligned financial summary with coloured rows (subtotal/VAT/total), footer grid (Terms & Conditions + Contact Details boxes), disclaimer, and footer image

### Changed
- **QuotationsList.jsx**: Migrated PDF download from html2pdf + hidden DOM template to `downloadQuotationPDF` (pdfmake). Removed `pdfRef`, `pdfData` state, and the 300ms `useEffect` delay hack
- **QuotationGenerator.jsx**: Migrated `downloadPDF` from html2pdf + hidden off-screen template to `downloadQuotationPDF` (pdfmake). Removed `pdfRef` and the hidden `QuotationTemplate` div; live preview panel still uses `QuotationTemplate` (React/HTML) unchanged

## [3.10.0] - 2026-02-24

### Fixed
- **Invoice PDF Alignment**: Migrated InvoicesList download from html2pdf to pdfmake for consistent, correctly-aligned PDF output matching the InvoiceGenerator preview
- **Invoice PDF Terms & Conditions**: Terms and conditions now render correctly in downloaded PDFs from the invoices list (previously used separate html2pdf path that could lose formatting)
- **Invoice PDF Disclaimer**: Fixed wrong settings key (`settings.disclaimer` → `settings.invoice_disclaimer`) that caused "This is a system generated invoice." to always appear instead of the configured disclaimer
- **Invoice PDF Disclaimer Default**: Removed hardcoded default disclaimer text; when no disclaimer is configured in settings, the PDF now shows the standard ANEX footer instead of the old placeholder text

## [3.9.9] - 2026-02-23

### Changed
- **Invoice PDF Spacing**: Adjusted margins in invoice-print.css for better layout
  - `.header-grid` margin top and bottom increased to 25px
  - `.section` margin-bottom increased to 15px
  - `.anex-row` margin-bottom increased to 15px

## [3.9.8] - 2026-02-23

### Fixed
- **Quotation Update 500 Error**: Fixed type coercion in PUT /api/quotations/:id route
  - Added proper parseFloat/parseInt for numeric fields (vat, discount, total, client_id)
  - Fixed client_id sending 0 instead of null when no client selected
  - Added error logging to quotation update route for better debugging

## [3.9.7] - 2026-02-23

### Fixed
- **Database Migration**: Synced production PostgreSQL database with Prisma schema
  - Added missing `quotation_number` and `valid_till_date` columns to quotations table
  - Resolved 500 error on `/api/quotations` caused by Prisma referencing non-existent columns
  - Used direct connection (port 5432) to bypass pgbouncer for DDL operations

## [3.9.6] - 2026-02-23

### Fixed
- **Quotation Update Error (500)**: Fixed database schema missing fields
  - Added `quotation_number` field to Quotation table
  - Added `valid_till_date` field to Quotation table
  - Fixed field mapping in quotations route (quotation_number was incorrectly mapped to work_order_number)
- **Quotation Save with Fields**: Updated handleSave to include all required fields
  - Ensures quotation_number and valid_till_date are persisted correctly
  - Fixes 500 error on quotation update endpoint

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
- Admin credentials configured via environment variables (SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD)
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
