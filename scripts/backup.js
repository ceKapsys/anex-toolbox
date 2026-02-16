#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sqlite3 = require(path.join(__dirname, '../server/node_modules/sqlite3')).verbose();

const serverDir = path.resolve(__dirname, '../server');
const dbPath = path.join(serverDir, 'anex.db');
const backupsDir = path.join(serverDir, 'backups');

// Create backups directory if it doesn't exist
if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
}

/**
 * Create a backup of the database
 */
function backupDatabase() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupPath = path.join(backupsDir, `anex_backup_${timestamp}.db`);
    
    console.log('🔄 Creating database backup...');
    console.log(`   Source: ${dbPath}`);
    console.log(`   Backup: ${backupPath}`);
    
    fs.copyFileSync(dbPath, backupPath);
    console.log('✓ Backup created successfully!');
    console.log('');
}

/**
 * List all available backups
 */
function listBackups() {
    if (!fs.existsSync(backupsDir)) {
        console.log('No backups found.');
        return;
    }
    
    const files = fs.readdirSync(backupsDir)
        .filter(f => f.startsWith('anex_backup_'))
        .sort()
        .reverse();
    
    if (files.length === 0) {
        console.log('No backups found.');
        return;
    }
    
    console.log('Available Backups:');
    files.forEach((file, index) => {
        const fullPath = path.join(backupsDir, file);
        const stats = fs.statSync(fullPath);
        const size = (stats.size / 1024).toFixed(2);
        console.log(`  ${index + 1}. ${file} (${size} KB)`);
    });
    console.log('');
}

/**
 * Restore from a backup
 */
function restoreDatabase(backupFile) {
    const backupPath = path.join(backupsDir, backupFile);
    
    if (!fs.existsSync(backupPath)) {
        console.error('❌ Backup file not found:', backupFile);
        process.exit(1);
    }
    
    console.log('⚠️  Restoring database from backup...');
    console.log(`   Backup: ${backupPath}`);
    console.log(`   Target: ${dbPath}`);
    
    // Create a backup of current state before restoring
    if (fs.existsSync(dbPath)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const preRestorePath = path.join(backupsDir, `anex_pre_restore_${timestamp}.db`);
        fs.copyFileSync(dbPath, preRestorePath);
        console.log(`   Pre-restore backup: ${preRestorePath}`);
    }
    
    // Restore the backup
    fs.copyFileSync(backupPath, dbPath);
    
    console.log('✓ Database restored successfully!');
    console.log('');
}

/**
 * Verify database integrity
 */
function verifyDatabase() {
    console.log('🔍 Verifying database integrity...');
    
    const db = new sqlite3.Database(dbPath);
    
    db.serialize(() => {
        // Check all tables exist
        db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;", [], (err, tables) => {
            if (err) {
                console.error('❌ Error reading tables:', err.message);
                db.close();
                process.exit(1);
            }
            
            console.log(`✓ Found ${tables.length} tables:`);
            tables.forEach(t => console.log(`   - ${t.name}`));
            console.log('');
            
            // Check specific important tables
            const requiredTables = ['admin_users', 'clients', 'invoices', 'quotations', 'settings'];
            let allPresent = true;
            
            requiredTables.forEach(table => {
                const exists = tables.some(t => t.name === table);
                console.log(`   ${exists ? '✓' : '❌'} ${table}`);
                if (!exists) allPresent = false;
            });
            
            if (allPresent) {
                console.log('');
                console.log('✓ All critical tables are present!');
            } else {
                console.log('');
                console.log('⚠️  Some critical tables are missing.');
            }
            
            db.close();
            process.exit(allPresent ? 0 : 1);
        });
    });
}

// Main execution
const command = process.argv[2];

switch(command) {
    case 'backup':
        backupDatabase();
        break;
    case 'list':
        listBackups();
        break;
    case 'restore':
        const backupFile = process.argv[3];
        if (!backupFile) {
            console.error('Usage: node backup.js restore <backup_filename>');
            process.exit(1);
        }
        restoreDatabase(backupFile);
        break;
    case 'verify':
        verifyDatabase();
        break;
    default:
        console.log('Database Backup & Restore Utility');
        console.log('');
        console.log('Usage:');
        console.log('  node backup.js backup          - Create a backup');
        console.log('  node backup.js list            - List all backups');
        console.log('  node backup.js restore <file>  - Restore from backup');
        console.log('  node backup.js verify          - Verify database integrity');
        console.log('');
        process.exit(0);
}
