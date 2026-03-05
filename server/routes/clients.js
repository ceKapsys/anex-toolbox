const express = require('express');
const router = express.Router();
const clientRepository = require('../repositories/ClientRepository');
const { isAuthenticated } = require('./auth');

// GET all clients
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const clients = await clientRepository.findAll({
            orderBy: { name: 'asc' }
        });
        res.json(clients);
    } catch (err) {
        console.error('Clients list error:', err.message);
        res.status(500).json({ error: 'Failed to retrieve clients' });
    }
});

// GET one client
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const client = await clientRepository.findById(req.params.id);
        if (!client) return res.status(404).json({ error: 'Client not found' });
        res.json(client);
    } catch (err) {
        console.error('Client get error:', err.message);
        res.status(500).json({ error: 'Failed to retrieve client' });
    }
});

// Check for duplicate client by name
router.get('/check/:name', isAuthenticated, async (req, res) => {
    try {
        const name = req.params.name;
        const client = await clientRepository.findByName(name);
        if (client) {
            return res.json({ exists: true, client });
        }
        res.json({ exists: false });
    } catch (err) {
        console.error('Client check error:', err.message);
        res.status(500).json({ error: 'Failed to check client' });
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
        console.error('Client create error:', err.message);
        res.status(500).json({ error: 'Failed to create client' });
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
        console.error('Client update error:', err.message);
        res.status(500).json({ error: 'Failed to update client' });
    }
});

// DELETE client
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        await clientRepository.delete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error('Client delete error:', err.message);
        res.status(500).json({ error: 'Failed to delete client' });
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
                console.error(`Failed to generate code for client ${client.id}`);
            }
        }

        res.json({ message: 'Migration complete', migrated: migratedCount });
    } catch (err) {
        console.error('Client migration error:', err.message);
        res.status(500).json({ error: 'Failed to migrate client codes' });
    }
});

module.exports = router;
