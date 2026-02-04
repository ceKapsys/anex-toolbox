const express = require('express');
const router = express.Router();
const db = require('../database');

const parseJson = (row) => {
    if (!row) return row;
    try { row.items = JSON.parse(row.items); } catch (e) { }
    return row;
};

router.get('/', (req, res) => {
    db.all("SELECT * FROM quotations ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(parseJson));
    });
});

router.get('/:id', (req, res) => {
    db.get("SELECT * FROM quotations WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Quotation not found' });
        res.json(parseJson(row));
    });
});

router.post('/', (req, res) => {
    const d = req.body;
    const items = JSON.stringify(d.items || []);

    const sql = `INSERT INTO quotations (
        client_id, to_company, to_address, attn, type, date, vat, discount,
        items, terms, contact_name, total, status
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const params = [
        d.client_id, d.to_company, d.to_address, d.attn, d.type, d.date, d.vat, d.discount,
        items, d.terms, d.contact_name, d.total, d.status || 'Draft'
    ];

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Quotation Created' });
    });
});

module.exports = router;
