# ANEX Database Backup & Restore Guide

## Current Status ✓
- **Database**: Verified and working WITHOUT any errors
- **All Tables**: Present and functional
- **Backup**: Clean state backed up at `server/backups/`

## How to Restore Your Old Data

### Option 1: If You Have an External Backup
If you have a previous backup of `anex.db` file (from an external drive, email, cloud storage, etc.):

1. **Place the backup file** in: `server/backups/`
2. **Restore it**:
   ```powershell
   cd c:\xampp\htdocs\WPtest\wp-content\plugins\anex-app
   node scripts/backup.js restore anex_backup_YOUR_FILENAME.db
   ```
3. **Verify it worked**:
   ```powershell
   node scripts/backup.js verify
   ```

### Option 2: If You Don't Have a Backup
Unfortunately, the previous database was deleted and cannot be recovered. However, you can:

1. **Manually Re-enter Data** into the fresh database
2. **Implement an automated backup system** (see below)

---

## Backup & Restore Commands

### ✅ Create a Backup
```powershell
cd c:\xampp\htdocs\WPtest\wp-content\plugins\anex-app
node scripts/backup.js backup
```
Automatically creates: `server/backups/anex_backup_TIMESTAMP.db`

### 📋 List All Backups
```powershell
node scripts/backup.js list
```
Shows all available backup files with sizes.

### ♻️ Restore from a Backup
```powershell
node scripts/backup.js restore anex_backup_2026-02-12T02-49-43.db
```
- Automatically saves current DB before restoring
- Creates pre-restore backup at: `server/backups/anex_pre_restore_TIMESTAMP.db`

### 🔍 Verify Database
```powershell
node scripts/backup.js verify
```
Checks that all tables exist and database is healthy.

---

## Recommended Backup Strategy

### Daily Automatic Backups (Optional)
Add this to your server startup script or Windows Task Scheduler:

```powershell
# Every night at 2 AM
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
$action = New-ScheduledTaskAction -Execute "node" -Argument "scripts/backup.js backup" -WorkingDirectory "C:\xampp\htdocs\WPtest\wp-content\plugins\anex-app"
Register-ScheduledTask -TaskName "ANEX DB Backup" -Trigger $trigger -Action $action -Force
```

### Manual Backups (Recommended)
Before any major changes or importing data:
```powershell
node scripts/backup.js backup
```

---

## Backup Location
All backups are stored in:
```
C:\xampp\htdocs\WPtest\wp-content\plugins\anex-app\server\backups\
```

You can also **manually copy this folder to an external drive** for safekeeping.

---

## Current Clean Database Info
- **Created**: 2026-02-12
- **Tables**: All 10 tables present and working
- **Admin User**: admin / admin123
- **Status**: Ready to use without any errors

---

## If You Have Questions
Review the backup.js script for detailed functionality, or contact your developer.
