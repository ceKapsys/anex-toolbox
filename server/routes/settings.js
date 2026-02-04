const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
    db.all("SELECT * FROM settings", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const settings = {};
        rows.forEach(r => {
            try {
                settings[r.key] = JSON.parse(r.value);
            } catch (e) {
                settings[r.key] = r.value;
            }
        });
        res.json(settings);
    });
});

router.post('/', (req, res) => {
    const { key, value } = req.body;
    const valStr = typeof value === 'object' ? JSON.stringify(value) : value;

    db.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, valStr], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Saved' });
    });
});

module.exports = router;
