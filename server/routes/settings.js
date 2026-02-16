const express = require('express');
const router = express.Router();
const settingRepository = require('../repositories/SettingRepository');
const { isAuthenticated } = require('./auth');

router.get('/', async (req, res) => {
    try {
        const rows = await settingRepository.findAll();
        const settings = {};
        rows.forEach(r => {
            try {
                settings[r.key] = JSON.parse(r.value);
            } catch (e) {
                settings[r.key] = r.value;
            }
        });
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { key, value } = req.body;
        const valStr = typeof value === 'object' ? JSON.stringify(value) : value;

        await settingRepository.upsert(key, valStr);
        res.json({ message: 'Saved' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
