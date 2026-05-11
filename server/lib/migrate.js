const { Pool } = require('pg');

// Applies missing schema changes that Prisma cannot auto-apply without migrations.
// Each entry is idempotent — safe to run on every startup.
const migrations = [
    {
        name: 'add_quotations_updated_at',
        sql: `ALTER TABLE quotations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`,
    },
    {
        name: 'add_client_idx_name',
        sql: `CREATE INDEX IF NOT EXISTS clients_name_idx ON clients (name);`,
    },
    {
        name: 'add_invoice_idx_client_id',
        sql: `CREATE INDEX IF NOT EXISTS invoices_client_id_idx ON invoices (client_id);`,
    },
    {
        name: 'add_invoice_idx_status',
        sql: `CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices (status);`,
    },
    {
        name: 'add_invoice_idx_issue_date',
        sql: `CREATE INDEX IF NOT EXISTS invoices_issue_date_idx ON invoices (issue_date);`,
    },
    {
        name: 'add_quotation_idx_client_id',
        sql: `CREATE INDEX IF NOT EXISTS quotations_client_id_idx ON quotations (client_id);`,
    },
    {
        name: 'add_quotation_idx_status',
        sql: `CREATE INDEX IF NOT EXISTS quotations_status_idx ON quotations (status);`,
    },
    {
        name: 'add_quotation_idx_date',
        sql: `CREATE INDEX IF NOT EXISTS quotations_date_idx ON quotations (date);`,
    },
];

async function runMigrations() {
    if (!process.env.DATABASE_URL) return;

    let connectionString = process.env.DATABASE_URL;
    if (connectionString.includes('#')) {
        connectionString = connectionString.replace(
            /^(postgresql:\/\/[^:]+:)([^@]+)(@.+)$/,
            (match, prefix, password, suffix) =>
                prefix + password.replace(/#/g, '%23') + suffix
        );
    }

    const pool = new Pool({ connectionString });
    try {
        for (const { name, sql } of migrations) {
            try {
                await pool.query(sql);
            } catch (err) {
                console.error(`Migration "${name}" failed:`, err.message);
            }
        }
        console.log('Schema migrations applied.');
    } finally {
        await pool.end();
    }
}

module.exports = { runMigrations };
