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
router.get('/:id', async (req, res) => {
    try {
        const service = await serviceRepository.findById(req.params.id);
        if (!service) return res.status(404).json({ error: 'Service not found' });
        res.json(service);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create service
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { name, description, shortcode } = req.body;
        const newService = await serviceRepository.create({ name, description, shortcode });
        res.json({ id: newService.id, message: 'Service created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update service
router.patch('/:id', isAuthenticated, async (req, res) => {
    try {
        const { name, description, shortcode } = req.body;
        await serviceRepository.update(req.params.id, { name, description, shortcode });
        res.json({ message: 'Service updated' });
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Service not found' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Delete service
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        await serviceRepository.delete(req.params.id);
        res.json({ message: 'Service deleted' });
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Service not found' });
        }
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
