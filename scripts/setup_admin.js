const bcrypt = require('../server/node_modules/bcryptjs');
const sqlite3 = require('../server/node_modules/sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../server/anex.db');
const db = new sqlite3.Database(dbPath);

// Default admin credentials
const defaultAdmin = {
    username: 'admin',
    password: 'admin123',  // User should change this after first login
    email: 'admin@anex.local',
    full_name: 'System Administrator'
};

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

    bcrypt.hash(defaultAdmin.password, 10, (err, hash) => {
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
                console.log('  Username: admin');
                console.log('  Password: admin123');
                console.log('  ⚠ Please change the password after first login!');
            }
            db.close();
        });
    });
});
