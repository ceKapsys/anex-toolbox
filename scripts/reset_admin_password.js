const path = require('path');
const bcrypt = require(path.join(__dirname, '../server/node_modules/bcryptjs'));
const sqlite3 = require(path.join(__dirname, '../server/node_modules/sqlite3')).verbose();
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const dbPath = path.resolve(__dirname, '../server/anex.db');
const db = new sqlite3.Database(dbPath);

console.log('Resetting admin password...');
console.log('');

const newPassword = process.env.SEED_ADMIN_PASSWORD;
if (!newPassword) {
    console.error('Error: SEED_ADMIN_PASSWORD environment variable is required.');
    console.error('Set it in your .env file or pass it as an environment variable.');
    process.exit(1);
}

const adminUsername = process.env.SEED_ADMIN_EMAIL || 'admin';
const passwordHash = bcrypt.hashSync(newPassword, 12);

db.run(
    "UPDATE admin_users SET password_hash = ? WHERE username = ?",
    [passwordHash, adminUsername],
    function(err) {
        if (err) {
            console.error('❌ Error resetting password:', err);
        } else if (this.changes > 0) {
            console.log('✓ Admin password reset successfully!');
            console.log('');
            console.log('Login Credentials:');
            console.log('  Username: ' + adminUsername);
            console.log('  Password has been reset to the value in SEED_ADMIN_PASSWORD');
            console.log('');
        } else {
            console.log('⚠ No admin user found to reset password');
        }
        db.close();
    }
);
