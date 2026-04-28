const express = require('express');
const router = express.Router();
const invoiceRepository = require('../repositories/InvoiceRepository');
const { isAuthenticated } = require('./auth');

// Whitelist of statuses the API will accept on writes. Anything else is
// rejected so an authenticated user cannot persist arbitrary status strings.
const VALID_INVOICE_STATUSES = new Set([
    'Draft', 'Sent', 'Submitted', 'Paid', 'Overdue', 'Cancelled'
]);

// Helper to parse JSON fields safely
const parseJson = (row) => {
    if (!row) return row;
    try { row.client_snapshot = JSON.parse(row.client_snapshot); } catch (e) { }
    try { row.bank_snapshot = JSON.parse(row.bank_snapshot); } catch (e) { }
    try { row.items_data = JSON.parse(row.items_data); } catch (e) { }
    try { row.totals_data = JSON.parse(row.totals_data); } catch (e) { }
    return row;
};

// GET all invoices
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const invoices = await invoiceRepository.findAll({
            orderBy: { id: 'desc' }
        });
        res.json(invoices.map(parseJson));
    } catch (err) {
        console.error('Invoices list error:', err.message);
        res.status(500).json({ error: 'Failed to retrieve invoices' });
    }
});

// GET single invoice
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const invoice = await invoiceRepository.findById(req.params.id);
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
        res.json(parseJson(invoice));
    } catch (err) {
        console.error('Invoice get error:', err.message);
        res.status(500).json({ error: 'Failed to retrieve invoice' });
    }
});

// POST create invoice
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const d = req.body;

        if (d.status !== undefined && !VALID_INVOICE_STATUSES.has(d.status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        const data = {
            invoice_no: d.invoice_no,
            invoice_type: d.invoice_type,
            service_id: d.service_id || null,
            client_id: d.client_id || null,
            client_snapshot: JSON.stringify(d.client_snapshot || d.client || {}),
            bank_snapshot: JSON.stringify(d.bank_snapshot || d.bank_details || {}),
            items_data: JSON.stringify(d.items_data || d.items || []),
            totals_data: JSON.stringify(d.totals_data || {}),
            quotation_ref: d.quotation_ref || null,
            work_order_ref: d.work_order_ref || null,
            adjustment_amount: d.adjustment_amount || 0,
            adjustment_note: d.adjustment_note || null,
            issue_date: d.issue_date || null,
            due_date: d.due_date || null,
            approved_by: d.approved_by || null,
            terms_id: d.terms_id || null,
            terms_text: d.terms_text || '',
            status: d.status || 'Draft',
            cogs: d.cogs || 0,
            amount_paid: d.amount_paid || 0,
            vds: d.vds || 0,
            tds: d.tds || 0,
            payment_date: d.payment_date || null
        };

        const newInvoice = await invoiceRepository.create(data);
        res.json({ id: newInvoice.id, message: 'Invoice Created' });
    } catch (err) {
        console.error('Invoice create error:', err.message);
        res.status(500).json({ error: 'Failed to create invoice' });
    }
});

// PATCH update invoice status
router.patch('/:id/status', isAuthenticated, async (req, res) => {
    try {
        const { status } = req.body;
        if (!status || !VALID_INVOICE_STATUSES.has(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }
        await invoiceRepository.update(req.params.id, { status });
        res.json({ message: 'Status updated' });
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        console.error('Invoice status update error:', err.message);
        res.status(500).json({ error: 'Failed to update invoice status' });
    }
});

// PATCH update payment details
router.patch('/:id/payment', isAuthenticated, async (req, res) => {
    try {
        const { amount_paid, vds, tds, cogs, payment_date, status } = req.body;

        if (status !== undefined && !VALID_INVOICE_STATUSES.has(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        // Only forward fields that were actually provided so the caller can do
        // partial updates without inadvertently clearing untouched columns.
        const data = {};
        if (amount_paid !== undefined) data.amount_paid = amount_paid;
        if (vds !== undefined) data.vds = vds;
        if (tds !== undefined) data.tds = tds;
        if (cogs !== undefined) data.cogs = cogs;
        if (payment_date !== undefined) data.payment_date = payment_date;
        if (status !== undefined) data.status = status;

        if (Object.keys(data).length === 0) {
            return res.json({ message: 'No changes provided' });
        }

        await invoiceRepository.update(req.params.id, data);
        res.json({ message: 'Payment details updated' });
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        console.error('Invoice payment update error:', err.message);
        res.status(500).json({ error: 'Failed to update payment details' });
    }
});

// PATCH update invoice (general)
router.patch('/:id', isAuthenticated, async (req, res) => {
    try {
        const d = req.body;

        if (d.status !== undefined && !VALID_INVOICE_STATUSES.has(d.status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        const data = {};

        if (d.invoice_no !== undefined) data.invoice_no = d.invoice_no;
        if (d.invoice_type !== undefined) data.invoice_type = d.invoice_type;
        if (d.service_id !== undefined) data.service_id = d.service_id;
        if (d.client_id !== undefined) data.client_id = d.client_id;
        if (d.client_snapshot !== undefined) data.client_snapshot = JSON.stringify(d.client_snapshot);
        if (d.bank_snapshot !== undefined) data.bank_snapshot = JSON.stringify(d.bank_snapshot);
        if (d.items_data !== undefined) data.items_data = JSON.stringify(d.items_data);
        if (d.totals_data !== undefined) data.totals_data = JSON.stringify(d.totals_data);
        if (d.quotation_ref !== undefined) data.quotation_ref = d.quotation_ref;
        if (d.work_order_ref !== undefined) data.work_order_ref = d.work_order_ref;
        if (d.adjustment_amount !== undefined) data.adjustment_amount = d.adjustment_amount;
        if (d.adjustment_note !== undefined) data.adjustment_note = d.adjustment_note;
        if (d.issue_date !== undefined) data.issue_date = d.issue_date;
        if (d.due_date !== undefined) data.due_date = d.due_date;
        if (d.approved_by !== undefined) data.approved_by = d.approved_by;
        if (d.terms_id !== undefined) data.terms_id = d.terms_id;
        if (d.terms_text !== undefined) data.terms_text = d.terms_text;
        if (d.status !== undefined) data.status = d.status;
        if (d.cogs !== undefined) data.cogs = d.cogs;
        if (d.amount_paid !== undefined) data.amount_paid = d.amount_paid;
        if (d.vds !== undefined) data.vds = d.vds;
        if (d.tds !== undefined) data.tds = d.tds;
        if (d.payment_date !== undefined) data.payment_date = d.payment_date;

        if (Object.keys(data).length === 0) return res.json({ message: 'No changes provided' });

        data.updated_at = new Date();
        await invoiceRepository.update(req.params.id, data);
        res.json({ message: 'Invoice updated successfully' });
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        console.error('Invoice update error:', err.message);
        res.status(500).json({ error: 'Failed to update invoice' });
    }
});

// DELETE invoice
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        await invoiceRepository.delete(req.params.id);
        res.json({ message: 'Invoice deleted' });
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        console.error('Invoice delete error:', err.message);
        res.status(500).json({ error: 'Failed to delete invoice' });
    }
});

module.exports = router;
