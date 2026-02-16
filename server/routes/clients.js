const express = require('express');
const router = express.Router();
const clientRepository = require('../repositories/ClientRepository');
const { isAuthenticated } = require('./auth');

// GET all clients
router.get('/', async (req, res) => {
    try {
        const clients = await clientRepository.findAll({
            orderBy: { name: 'asc' }
        });
        res.json(clients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET one client
router.get('/:id', async (req, res) => {
    try {
        const client = await clientRepository.findById(req.params.id);
        if (!client) return res.status(404).json({ error: 'Client not found' });
        res.json(client);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Check for duplicate client by name
router.get('/check/:name', async (req, res) => {
    try {
        const name = req.params.name;
        const client = await clientRepository.findByName(name);
        if (client) {
            return res.json({ exists: true, client });
        }
        res.json({ exists: false });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create client with auto-generated client code
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { name, company, address, bin, email, phone, attn } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Client name is required' });
        }

        // Check for duplicate name first
        const existingClient = await clientRepository.findByName(name);

        if (existingClient) {
            return res.status(409).json({
                error: 'A client with this name already exists',
                existingClient: existingClient
            });
        }

        // Generate unique client code
        const clientCode = await clientRepository.generateClientCode(name);

        const newClient = await clientRepository.create({
            client_code: clientCode,
            name,
            company: company || name,
            address,
            bin,
            email,
            phone,
            attn
        });

        res.json(newClient);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update client
router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const { name, company, address, bin, email, phone, attn } = req.body;
        const updatedClient = await clientRepository.update(req.params.id, {
            name, company, address, bin, email, phone, attn
        });
        res.json({ message: 'Updated', client: updatedClient });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE client
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        await clientRepository.delete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST migrate - Generate client_code for existing clients without one
router.post('/migrate-codes', isAuthenticated, async (req, res) => {
    try {
        const clients = await clientRepository.findAll();
        const clientsToMigrate = clients.filter(c => !c.client_code);

        if (clientsToMigrate.length === 0) {
            return res.json({ message: 'No clients need migration', migrated: 0 });
        }

        let migratedCount = 0;
        for (const client of clientsToMigrate) {
            try {
                const clientCode = await clientRepository.generateClientCode(client.name);
                await clientRepository.update(client.id, { client_code: clientCode });
                migratedCount++;
            } catch (err) {
                console.error(`Failed to generate code for client ${client.id}:`, err);
            }
        }

        res.json({ message: 'Migration complete', migrated: migratedCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
