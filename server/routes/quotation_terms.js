const express = require('express');
const router = express.Router();
const quotationTermRepository = require('../repositories/QuotationTermRepository');
const { isAuthenticated } = require('./auth');

// Get all quotation terms
router.get('/', async (req, res) => {
    try {
        const terms = await quotationTermRepository.findAll({
            orderBy: { id: 'desc' }
        });
        res.json(terms || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single quotation term
router.get('/:id', (req, res) => {
    db.get("SELECT * FROM quotation_terms WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Term not found' });
        res.json(row);
    });
});

// Create quotation term
router.post('/', isAuthenticated, (req, res) => {
    const { name, description } = req.body;
    const sql = "INSERT INTO quotation_terms (name, description) VALUES (?, ?)";

    db.run(sql, [name, description], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Quotation Term created' });
    });
});

// Update quotation term
router.patch('/:id', (req, res) => {
    const { name, description } = req.body;
    const sql = "UPDATE quotation_terms SET name = ?, description = ? WHERE id = ?";

    db.run(sql, [name, description, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Quotation Term updated' });
    });
});

// Delete quotation term
router.delete('/:id', isAuthenticated, (req, res) => {
    db.run("DELETE FROM quotation_terms WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Quotation Term deleted' });
    });
});

module.exports = router;
