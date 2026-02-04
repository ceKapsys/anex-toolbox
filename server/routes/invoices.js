const express = require('express');
const router = express.Router();
const db = require('../database');

// Helper to parse JSON fields safely
const parseJson = (row) => {
    if (!row) return row;
    try { row.client_snapshot = JSON.parse(row.client_snapshot); } catch (e) { }
    try { row.bank_snapshot = JSON.parse(row.bank_snapshot); } catch (e) { }
    try { row.items_data = JSON.parse(row.items_data); } catch (e) { }
    try { row.totals_data = JSON.parse(row.totals_data); } catch (e) { }
    return row;
};

router.get('/', (req, res) => {
    db.all("SELECT * FROM invoices ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(parseJson));
    });
});

router.get('/:id', (req, res) => {
    db.get("SELECT * FROM invoices WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Invoice not found' });
        res.json(parseJson(row));
    });
});

router.post('/', (req, res) => {
    const d = req.body;
    const client_snapshot = JSON.stringify(d.client_snapshot || {});
    const bank_snapshot = JSON.stringify(d.bank_snapshot || {});
    const items_data = JSON.stringify(d.items_data || []);
    const totals_data = JSON.stringify(d.totals_data || {});

    const sql = `INSERT INTO invoices (
        invoice_no, invoice_type, client_id, client_snapshot, bank_snapshot,
        items_data, totals_data, quotation_ref, work_order_ref,
        adjustment_amount, adjustment_note, issue_date, due_date, approved_by, status
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const params = [
        d.invoice_no, d.invoice_type, d.client_id, client_snapshot, bank_snapshot,
        items_data, totals_data, d.quotation_ref, d.work_order_ref,
        d.adjustment_amount, d.adjustment_note, d.issue_date, d.due_date, d.approved_by, d.status || 'Draft'
    ];

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Invoice Created' });
    });
});

// Update status
router.patch('/:id/status', (req, res) => {
    const { status } = req.body;
    db.run("UPDATE invoices SET status = ? WHERE id = ?", [status, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Status updated' });
    });
});

module.exports = router;
