require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const sqlPath = path.join(__dirname, '..', 'server', 'security', 'fix_supabase_advisor.sql');

const run = async () => {
    let connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error('DATABASE_URL is not set');
    }

    // Ensure URL parsing is safe when password contains '#'.
    connectionString = connectionString.replace(
        /^(postgresql:\/\/[^:]+:)([^@]+)(@.+)$/,
        (match, prefix, password, suffix) => prefix + password.replace(/#/g, '%23') + suffix
    );

    const sql = fs.readFileSync(sqlPath, 'utf8');
    const client = new Client({ connectionString });

    await client.connect();
    try {
        await client.query(sql);
        console.log('Security hardening SQL applied successfully.');
    } finally {
        await client.end();
    }
};

run().catch((err) => {
    console.error('Failed to apply security hardening:', err.message);
    process.exit(1);
});
