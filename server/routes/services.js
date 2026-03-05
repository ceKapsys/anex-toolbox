const express = require('express');
const router = express.Router();
const serviceRepository = require('../repositories/ServiceRepository');
const { isAuthenticated } = require('./auth');

// Get all services
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const services = await serviceRepository.findAll({
            orderBy: { id: 'desc' }
        });
        res.json(services || []);
    } catch (err) {
        console.error('Services list error:', err.message);
        res.status(500).json({ error: 'Failed to retrieve services' });
    }
});

// Get single service
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const service = await serviceRepository.findById(req.params.id);
        if (!service) return res.status(404).json({ error: 'Service not found' });
        res.json(service);
    } catch (err) {
        console.error('Service get error:', err.message);
        res.status(500).json({ error: 'Failed to retrieve service' });
    }
});

// Create service
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { name, description, shortcode } = req.body;
        const newService = await serviceRepository.create({ name, description, shortcode });
        res.json({ id: newService.id, message: 'Service created' });
    } catch (err) {
        console.error('Service create error:', err.message);
        res.status(500).json({ error: 'Failed to create service' });
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
        console.error('Service update error:', err.message);
        res.status(500).json({ error: 'Failed to update service' });
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
        console.error('Service delete error:', err.message);
        res.status(500).json({ error: 'Failed to delete service' });
    }
});

module.exports = router;
