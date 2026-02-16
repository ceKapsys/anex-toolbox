const express = require('express');
const router = express.Router();
const serviceRepository = require('../repositories/ServiceRepository');
const { isAuthenticated } = require('./auth');

// Get all services
router.get('/', async (req, res) => {
    try {
        const services = await serviceRepository.findAll({
            orderBy: { id: 'desc' }
        });
        res.json(services || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single service
router.get('/:id', (req, res) => {
    db.get("SELECT * FROM services WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Service not found' });
        res.json(row);
    });
});

// Create service
router.post('/', isAuthenticated, (req, res) => {
    const { name, description, shortcode } = req.body;
    const sql = "INSERT INTO services (name, description, shortcode) VALUES (?, ?, ?)";

    db.run(sql, [name, description, shortcode], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Service created' });
    });
});

// Update service
router.patch('/:id', (req, res) => {
    const { name, description, shortcode } = req.body;
    const sql = "UPDATE services SET name = ?, description = ?, shortcode = ? WHERE id = ?";

    db.run(sql, [name, description, shortcode, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Service updated' });
    });
});

// Delete service
router.delete('/:id', isAuthenticated, (req, res) => {
    db.run("DELETE FROM services WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Service deleted' });
    });
});

module.exports = router;
