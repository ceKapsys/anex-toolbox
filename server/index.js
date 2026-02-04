const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Large limit for base64 PDFs or images

// Routes
const clientsRoutes = require('./routes/clients');
const invoicesRoutes = require('./routes/invoices');
const quotationsRoutes = require('./routes/quotations');
const settingsRoutes = require('./routes/settings');

app.use('/api/clients', clientsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/quotations', quotationsRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/', (req, res) => {
    res.send('ANEX Tools API Running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
