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
router.get('/:id', async (req, res) => {
    try {
        const term = await termRepository.findById(req.params.id);
        if (!term) return res.status(404).json({ error: 'Term not found' });
        res.json(term);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create term
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { name, description, type } = req.body;
        const newTerm = await termRepository.create({
            name,
            description,
            type: type || 'invoice'
        });
        res.json({ id: newTerm.id, message: 'Term created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update term
router.patch('/:id', isAuthenticated, async (req, res) => {
    try {
        const { name, description, type } = req.body;
        await termRepository.update(req.params.id, { name, description, type });
        res.json({ message: 'Term updated' });
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Term not found' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Delete term
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        await termRepository.delete(req.params.id);
        res.json({ message: 'Term deleted' });
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Term not found' });
        }
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
