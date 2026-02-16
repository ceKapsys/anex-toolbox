const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

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
            client_code TEXT UNIQUE,
            name TEXT,
            company TEXT,
            address TEXT,
            bin TEXT,
            email TEXT,
            phone TEXT,
            logo TEXT,
            attn TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Migration: Add new columns to clients if they don't exist
        const clientColumnsToAdd = [
            { name: 'client_code', type: 'TEXT' },
            { name: 'bin', type: 'TEXT' }
        ];
        clientColumnsToAdd.forEach(col => {
            db.run(`ALTER TABLE clients ADD COLUMN ${col.name} ${col.type}`, (err) => { });
        });

        // Invoices
        db.run(`CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_no TEXT,
            invoice_type TEXT,
            service_id INTEGER,
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
            terms_id INTEGER,
            terms_text TEXT,
            status TEXT DEFAULT 'Draft',
            version INTEGER DEFAULT 1,
            cogs REAL DEFAULT 0,
            amount_paid REAL DEFAULT 0,
            vds REAL DEFAULT 0,
            tds REAL DEFAULT 0,
            payment_date TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Migrations: Add columns if they don't exist (simplistic approach for this env)
        const columnsToAdd = [
            { name: 'amount_paid', type: 'REAL DEFAULT 0' },
            { name: 'vds', type: 'REAL DEFAULT 0' },
            { name: 'tds', type: 'REAL DEFAULT 0' },
            { name: 'payment_date', type: 'TEXT' },
            { name: 'service_id', type: 'INTEGER' },
            { name: 'terms_id', type: 'INTEGER' },
            { name: 'terms_text', type: 'TEXT' }
        ];

        const termsColumns = [
            { name: 'type', type: "TEXT DEFAULT 'invoice'" }
        ];

        columnsToAdd.forEach(col => {
            db.run(`ALTER TABLE invoices ADD COLUMN ${col.name} ${col.type}`, (err) => { });
        });

        termsColumns.forEach(col => {
            db.run(`ALTER TABLE terms ADD COLUMN ${col.name} ${col.type}`, (err) => { });
        });

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
            work_order_number TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Services
        db.run(`CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            shortcode TEXT NOT NULL UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Terms
        db.run(`CREATE TABLE IF NOT EXISTS terms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT DEFAULT 'invoice',
            name TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Quotation Terms
        db.run(`CREATE TABLE IF NOT EXISTS quotation_terms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Admin Users
        db.run(`CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            email TEXT,
            full_name TEXT,
            last_login DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Sessions
        db.run(`CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES admin_users(id)
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

        // Seed default admin user if none exists
        setTimeout(() => {
            db.run("SELECT COUNT(*) as count FROM admin_users", [], (err, row) => {
                if (err) {
                    console.error('Error checking admin users:', err);
                    return;
                }

                const adminCount = row ? row.count : 0;
                if (adminCount === 0) {
                    const defaultPassword = 'admin123';
                    const passwordHash = bcrypt.hashSync(defaultPassword, 10);
                    
                    db.run(
                        `INSERT INTO admin_users (username, password_hash, email, full_name) 
                         VALUES (?, ?, ?, ?)`,
                        ['admin', passwordHash, 'admin@anex.com', 'Administrator'],
                        function(err) {
                            if (err) {
                                console.error('Error seeding admin user:', err);
                            } else {
                                console.log('✓ Default admin user created (username: admin, password: admin123)');
                            }
                        }
                    );
                } else {
                    console.log('✓ Admin user(s) already exist');
                }
            });
        }, 500);
    });
}

module.exports = db;
