const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'anex.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        console.log('Connected to SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Clients
        db.run(`CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            company TEXT,
            address TEXT,
            email TEXT,
            phone TEXT,
            logo TEXT,
            attn TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Invoices
        db.run(`CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_no TEXT,
            invoice_type TEXT,
            client_id INTEGER,
            client_snapshot TEXT,
            bank_snapshot TEXT,
            items_data TEXT,
            totals_data TEXT,
            quotation_ref TEXT,
            work_order_ref TEXT,
            adjustment_amount REAL,
            adjustment_note TEXT,
            issue_date TEXT,
            due_date TEXT,
            approved_by TEXT,
            status TEXT DEFAULT 'Draft',
            version INTEGER DEFAULT 1,
            cogs REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Quotations
        db.run(`CREATE TABLE IF NOT EXISTS quotations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER,
            to_company TEXT,
            to_address TEXT,
            attn TEXT,
            type TEXT,
            date TEXT,
            vat REAL,
            discount REAL,
            items TEXT,
            terms TEXT,
            contact_name TEXT,
            total REAL,
            status TEXT DEFAULT 'Draft',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Settings
        db.run(`CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )`);

        // Seed default settings if empty
        const defaultSettings = [
            ['company_details', '{}'],
            ['company_logo', ''],
            ['bank_details', '[]'],
            ['bank_logo', ''],
            ['quotation_header', ''],
            ['quotation_footer', ''],
            ['terms_invoice', ''],
            ['terms_quote', '']
        ];
        
        const stmt = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
        defaultSettings.forEach(s => stmt.run(s));
        stmt.finalize();
    });
}

module.exports = db;
