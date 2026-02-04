const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all clients
router.get('/', (req, res) => {
    db.all("SELECT * FROM clients ORDER BY name ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// GET one client
router.get('/:id', (req, res) => {
    db.get("SELECT * FROM clients WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Client not found' });
        res.json(row);
    });
});

// POST create client
router.post('/', (req, res) => {
    const { name, company, address, email, phone, logo, attn } = req.body;
    const sql = "INSERT INTO clients (name, company, address, email, phone, logo, attn) VALUES (?,?,?,?,?,?,?)";
    const params = [name, company, address, email, phone, logo, attn];
    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, ...req.body });
    });
});

// PUT update client
router.put('/:id', (req, res) => {
    const { name, company, address, email, phone, logo, attn } = req.body;
    const sql = "UPDATE clients SET name=?, company=?, address=?, email=?, phone=?, logo=?, attn=? WHERE id=?";
    const params = [name, company, address, email, phone, logo, attn, req.params.id];
    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Updated', changes: this.changes });
    });
});

// DELETE client
router.delete('/:id', (req, res) => {
    db.run("DELETE FROM clients WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted', changes: this.changes });
    });
});

module.exports = router;
