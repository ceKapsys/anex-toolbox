const express = require('express');
const router = express.Router();
const settingRepository = require('../repositories/SettingRepository');
const { isAuthenticated } = require('./auth');

router.get('/', isAuthenticated, async (req, res) => {
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

        // Mask sensitive SMTP password in response
        if (settings.smtp_config && settings.smtp_config.password) {
            settings.smtp_config = {
                ...settings.smtp_config,
                password: '********'
            };
        }

        res.json(settings);
    } catch (err) {
        console.error('Settings get error:', err.message);
        res.status(500).json({ error: 'Failed to retrieve settings' });
    }
});

router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { key, value } = req.body;

        if (!key) {
            return res.status(400).json({ error: 'Setting key is required' });
        }

        const valStr = typeof value === 'object' ? JSON.stringify(value) : value;

        await settingRepository.upsert(key, valStr);
        res.json({ message: 'Saved' });
    } catch (err) {
        console.error('Settings save error:', err.message);
        res.status(500).json({ error: 'Failed to save setting' });
    }
});

module.exports = router;
