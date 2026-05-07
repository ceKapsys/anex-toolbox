const express = require('express');
const router = express.Router();
const multer = require('multer');
const prisma = require('../lib/prisma');
const { isAuthenticated } = require('./auth');

// Accept JSON files up to 50 MB
const jsonUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const isJson =
            file.mimetype === 'application/json' ||
            file.mimetype === 'text/plain' ||
            file.originalname.toLowerCase().endsWith('.json');
        if (isJson) {
            cb(null, true);
        } else {
            cb(new Error('Only JSON backup files are allowed'), false);
        }
    }
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const parseUploadedJson = (buffer) => {
    try {
        const parsed = JSON.parse(buffer.toString('utf8'));
        // Accept both a bare array and a wrapped { invoices:[...] / quotations:[...] } object
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === 'object') {
            const key = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
            if (key) return parsed[key];
        }
        return null;
    } catch {
        return null;
    }
};

// ── Invoice endpoints ─────────────────────────────────────────────────────────

// GET /api/backup/invoices — export all invoices as JSON
router.get('/invoices', isAuthenticated, async (req, res) => {
    try {
        const invoices = await prisma.invoice.findMany({ orderBy: { id: 'asc' } });

        const payload = {
            type: 'invoices',
            exported_at: new Date().toISOString(),
            count: invoices.length,
            invoices,
        };

        const filename = `invoices-backup-${new Date().toISOString().split('T')[0]}.json`;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.json(payload);
    } catch (err) {
        console.error('Invoice backup error:', err.message);
        res.status(500).json({ error: 'Failed to export invoices' });
    }
});

// POST /api/backup/invoices/restore — import invoices from a JSON backup
router.post('/invoices/restore', isAuthenticated, jsonUpload.single('backup'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No backup file provided' });
    }

    const records = parseUploadedJson(req.file.buffer);
    if (!records) {
        return res.status(400).json({ error: 'Invalid JSON backup file' });
    }
    if (records.length === 0) {
        return res.json({ imported: 0, skipped: 0, errors: [] });
    }

    // Fetch existing invoice_nos so we can skip duplicates
    const existing = await prisma.invoice.findMany({ select: { invoice_no: true } });
    const existingNos = new Set(existing.map(r => r.invoice_no).filter(Boolean));

    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (const record of records) {
        try {
            // Skip if the invoice number already exists in the DB
            if (record.invoice_no && existingNos.has(record.invoice_no)) {
                skipped++;
                continue;
            }

            // Strip the auto-assigned DB id so Postgres auto-increments a new one
            const { id, ...fields } = record;

            // Coerce date strings back to Date objects for DateTime columns
            const data = {
                ...fields,
                created_at: fields.created_at ? new Date(fields.created_at) : new Date(),
                updated_at: fields.updated_at ? new Date(fields.updated_at) : new Date(),
            };

            await prisma.invoice.create({ data });
            if (record.invoice_no) existingNos.add(record.invoice_no);
            imported++;
        } catch (err) {
            errors.push({ invoice_no: record.invoice_no || '(unknown)', error: err.message });
        }
    }

    res.json({ imported, skipped, errors });
});

// ── Quotation endpoints ───────────────────────────────────────────────────────

// GET /api/backup/quotations — export all quotations as JSON
router.get('/quotations', isAuthenticated, async (req, res) => {
    try {
        const quotations = await prisma.quotation.findMany({ orderBy: { id: 'asc' } });

        const payload = {
            type: 'quotations',
            exported_at: new Date().toISOString(),
            count: quotations.length,
            quotations,
        };

        const filename = `quotations-backup-${new Date().toISOString().split('T')[0]}.json`;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.json(payload);
    } catch (err) {
        console.error('Quotation backup error:', err.message);
        res.status(500).json({ error: 'Failed to export quotations' });
    }
});

// POST /api/backup/quotations/restore — import quotations from a JSON backup
router.post('/quotations/restore', isAuthenticated, jsonUpload.single('backup'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No backup file provided' });
    }

    const records = parseUploadedJson(req.file.buffer);
    if (!records) {
        return res.status(400).json({ error: 'Invalid JSON backup file' });
    }
    if (records.length === 0) {
        return res.json({ imported: 0, skipped: 0, errors: [] });
    }

    // Fetch existing quotation_numbers so we can skip duplicates
    const existing = await prisma.quotation.findMany({ select: { quotation_number: true } });
    const existingNos = new Set(existing.map(r => r.quotation_number).filter(Boolean));

    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (const record of records) {
        try {
            if (record.quotation_number && existingNos.has(record.quotation_number)) {
                skipped++;
                continue;
            }

            const { id, ...fields } = record;

            const data = {
                ...fields,
                created_at: fields.created_at ? new Date(fields.created_at) : new Date(),
                updated_at: fields.updated_at ? new Date(fields.updated_at) : new Date(),
            };

            await prisma.quotation.create({ data });
            if (record.quotation_number) existingNos.add(record.quotation_number);
            imported++;
        } catch (err) {
            errors.push({ quotation_number: record.quotation_number || '(unknown)', error: err.message });
        }
    }

    res.json({ imported, skipped, errors });
});

module.exports = router;
