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
router.get('/:id', async (req, res) => {
    try {
        const term = await quotationTermRepository.findById(req.params.id);
        if (!term) return res.status(404).json({ error: 'Term not found' });
        res.json(term);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create quotation term
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { name, description } = req.body;
        const newTerm = await quotationTermRepository.create({ name, description });
        res.json({ id: newTerm.id, message: 'Quotation Term created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update quotation term
router.patch('/:id', isAuthenticated, async (req, res) => {
    try {
        const { name, description } = req.body;
        await quotationTermRepository.update(req.params.id, { name, description });
        res.json({ message: 'Quotation Term updated' });
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Term not found' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Delete quotation term
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        await quotationTermRepository.delete(req.params.id);
        res.json({ message: 'Quotation Term deleted' });
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Term not found' });
        }
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
