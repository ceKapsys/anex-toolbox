const bcrypt = require('../server/node_modules/bcryptjs');
const sqlite3 = require('../server/node_modules/sqlite3').verbose();
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const dbPath = path.resolve(__dirname, '../server/anex.db');
const db = new sqlite3.Database(dbPath);

// Admin credentials from environment variables
const defaultAdmin = {
    username: process.env.SEED_ADMIN_EMAIL || 'admin',
    password: process.env.SEED_ADMIN_PASSWORD,
    email: process.env.SEED_ADMIN_EMAIL || 'admin@anex.local',
    full_name: process.env.SEED_ADMIN_NAME || 'System Administrator'
};

if (!defaultAdmin.password) {
    console.error('Error: SEED_ADMIN_PASSWORD environment variable is required.');
    console.error('Set it in your .env file or pass it as an environment variable.');
    process.exit(1);
}

console.log('Setting up default admin user...');

db.get("SELECT id FROM admin_users WHERE username = ?", [defaultAdmin.username], (err, existingUser) => {
    if (err) {
        console.error('Error checking for existing admin:', err);
        db.close();
        return;
    }

    if (existingUser) {
        console.log('Admin user already exists. Skipping setup.');
        db.close();
        return;
    }

    bcrypt.hash(defaultAdmin.password, 12, (err, hash) => {
        if (err) {
            console.error('Error hashing password:', err);
            db.close();
            return;
        }

        const sql = `INSERT INTO admin_users (username, password_hash, email, full_name) VALUES (?, ?, ?, ?)`;
        const params = [defaultAdmin.username, hash, defaultAdmin.email, defaultAdmin.full_name];

        db.run(sql, params, function(err) {
            if (err) {
                console.error('Error creating admin user:', err);
            } else {
                console.log('✓ Default admin user created successfully!');
                console.log('  Username: ' + defaultAdmin.username);
                console.log('  ⚠ Please change the password after first login!');
            }
            db.close();
        });
    });
});
