const express = require('express');
const router = express.Router();
const termRepository = require('../repositories/TermRepository');
const { isAuthenticated } = require('./auth');

// Get all terms
router.get('/', async (req, res) => {
    try {
        const terms = await termRepository.findAll({
            orderBy: { id: 'desc' }
        });
        res.json(terms || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single term
router.get('/:id', (req, res) => {
    db.get("SELECT * FROM terms WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Term not found' });
        res.json(row);
    });
});

// Create term
router.post('/', isAuthenticated, (req, res) => {
    const { name, description, type } = req.body;
    const sql = "INSERT INTO terms (name, description, type) VALUES (?, ?, ?)";

    db.run(sql, [name, description, type || 'invoice'], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Term created' });
    });
});

// Update term
router.patch('/:id', (req, res) => {
    const { name, description, type } = req.body;
    const sql = "UPDATE terms SET name = ?, description = ?, type = ? WHERE id = ?";

    db.run(sql, [name, description, type, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Term updated' });
    });
});

// Delete term
router.delete('/:id', isAuthenticated, (req, res) => {
    db.run("DELETE FROM terms WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Term deleted' });
    });
});

module.exports = router;
