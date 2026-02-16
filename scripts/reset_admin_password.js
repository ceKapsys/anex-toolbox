const path = require('path');
const bcrypt = require(path.join(__dirname, '../server/node_modules/bcryptjs'));
const sqlite3 = require(path.join(__dirname, '../server/node_modules/sqlite3')).verbose();

const dbPath = path.resolve(__dirname, '../server/anex.db');
const db = new sqlite3.Database(dbPath);

console.log('Resetting admin password...');
console.log('');

const newPassword = 'admin123';
const passwordHash = bcrypt.hashSync(newPassword, 10);

db.run(
    "UPDATE admin_users SET password_hash = ? WHERE username = 'admin'",
    [passwordHash],
    function(err) {
        if (err) {
            console.error('❌ Error resetting password:', err);
        } else if (this.changes > 0) {
            console.log('✓ Admin password reset successfully!');
            console.log('');
            console.log('Login Credentials:');
            console.log('  Username: admin');
            console.log('  Password: admin123');
            console.log('');
        } else {
            console.log('⚠ No admin user found to reset password');
        }
        db.close();
    }
);
