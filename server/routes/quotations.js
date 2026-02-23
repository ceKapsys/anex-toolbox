const express = require('express');
const router = express.Router();
const quotationRepository = require('../repositories/QuotationRepository');
const { isAuthenticated } = require('./auth');

const parseJson = (row) => {
    if (!row) return row;
    try { row.items = JSON.parse(row.items); } catch (e) { }
    return row;
};

router.get('/', async (req, res) => {
    try {
        const quotations = await quotationRepository.findAll({
            orderBy: { id: 'desc' }
        });
        res.json(quotations.map(parseJson));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const quotation = await quotationRepository.findById(req.params.id);
        if (!quotation) return res.status(404).json({ error: 'Quotation not found' });
        res.json(parseJson(quotation));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', isAuthenticated, async (req, res) => {
    try {
        const d = req.body;
        const items = JSON.stringify(d.items || []);

        const data = {
            quotation_number: d.quotation_number || null,
            client_id: d.client_id ? parseInt(d.client_id, 10) : null,
            to_company: d.to_company || null,
            to_address: d.to_address || null,
            attn: d.attn || null,
            type: d.type || null,
            date: d.date || null,
            valid_till_date: d.valid_till_date || null,
            vat: d.vat !== undefined && d.vat !== '' ? parseFloat(d.vat) : null,
            discount: d.discount !== undefined && d.discount !== '' ? parseFloat(d.discount) : null,
            items,
            terms: d.terms || null,
            contact_name: d.contact_name || null,
            total: d.total !== undefined && d.total !== '' ? parseFloat(d.total) : null,
            status: d.status || 'Draft',
            work_order_number: d.work_order_number || null
        };

        const newQuotation = await quotationRepository.create(data);
        res.json({ id: newQuotation.id, message: 'Quotation Created' });
    } catch (err) {
        console.error('Quotation Create Error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const d = req.body;

        const data = {};
        if (d.quotation_number !== undefined) data.quotation_number = d.quotation_number;
        if (d.client_id !== undefined) data.client_id = d.client_id;
        if (d.to_company !== undefined) data.to_company = d.to_company;
        if (d.to_address !== undefined) data.to_address = d.to_address;
        if (d.attn !== undefined) data.attn = d.attn;
        if (d.type !== undefined) data.type = d.type;
        if (d.date !== undefined) data.date = d.date;
        if (d.valid_till_date !== undefined) data.valid_till_date = d.valid_till_date;
        if (d.vat !== undefined) data.vat = d.vat;
        if (d.discount !== undefined) data.discount = d.discount;
        if (d.items) data.items = JSON.stringify(d.items);
        if (d.terms !== undefined) data.terms = d.terms;
        if (d.contact_name !== undefined) data.contact_name = d.contact_name;
        if (d.total !== undefined) data.total = d.total;
        if (d.status !== undefined) data.status = d.status;
        if (d.work_order_number !== undefined) data.work_order_number = d.work_order_number;

        if (Object.keys(data).length === 0) return res.json({ message: 'No changes provided' });

        await quotationRepository.update(req.params.id, data);
        res.json({ message: 'Quotation updated successfully' });
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Quotation not found' });
        }
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        await quotationRepository.delete(req.params.id);
        res.json({ message: 'Quotation deleted successfully' });
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Quotation not found' });
        }
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
