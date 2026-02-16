const express = require('express');
const router = express.Router();
const invoiceRepository = require('../repositories/InvoiceRepository');
const { isAuthenticated } = require('./auth');

// Helper to parse JSON fields safely
const parseJson = (row) => {
    if (!row) return row;
    try { row.client_snapshot = JSON.parse(row.client_snapshot); } catch (e) { }
    try { row.bank_snapshot = JSON.parse(row.bank_snapshot); } catch (e) { }
    try { row.items_data = JSON.parse(row.items_data); } catch (e) { }
    try { row.totals_data = JSON.parse(row.totals_data); } catch (e) { }
    return row;
};


router.post('/', isAuthenticated, (req, res) => {
    const d = req.body;
    const client_snapshot = JSON.stringify(d.client_snapshot || d.client || {});
    const bank_snapshot = JSON.stringify(d.bank_snapshot || d.bank_details || {});
    const items_data = JSON.stringify(d.items_data || d.items || []);
    const totals_data = JSON.stringify(d.totals_data || {});

    const sql = `INSERT INTO invoices (
        invoice_no, invoice_type, service_id, client_id, client_snapshot, bank_snapshot,
        items_data, totals_data, quotation_ref, work_order_ref,
        adjustment_amount, adjustment_note, issue_date, due_date, approved_by, 
        terms_id, terms_text, status,
        cogs, amount_paid, vds, tds, payment_date
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const params = [
        d.invoice_no, d.invoice_type, d.service_id || null, d.client_id || null, client_snapshot, bank_snapshot,
        items_data, totals_data, d.quotation_ref, d.work_order_ref,
        d.adjustment_amount || 0, d.adjustment_note, d.issue_date, d.due_date, d.approved_by,
        d.terms_id || null, d.terms_text || '', d.status || 'Draft',
        d.cogs || 0, d.amount_paid || 0, d.vds || 0, d.tds || 0, d.payment_date || null
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

// Update payment details
router.patch('/:id/payment', (req, res) => {
    const { amount_paid, vds, tds, cogs, payment_date, status } = req.body;
    const sql = `UPDATE invoices SET 
        amount_paid = ?, 
        vds = ?, 
        tds = ?, 
        cogs = ?, 
        payment_date = ?, 
        status = ? 
        WHERE id = ?`;

    db.run(sql, [amount_paid, vds, tds, cogs, payment_date, status, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Payment details updated' });
    });
});

// Delete invoice
router.delete('/:id', isAuthenticated, (req, res) => {
    db.run("DELETE FROM invoices WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Invoice deleted' });
    });
});

module.exports = router;
