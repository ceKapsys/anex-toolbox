const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Large limit for base64 PDFs or images

// Routes
const clientsRoutes = require('./routes/clients');
const invoicesRoutes = require('./routes/invoices');
const quotationsRoutes = require('./routes/quotations');
const settingsRoutes = require('./routes/settings');
const servicesRoutes = require('./routes/services');
const termsRoutes = require('./routes/terms');
const emailRoutes = require('./routes/email');
const { router: authRoutes } = require('./routes/auth');

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/quotations', quotationsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/terms', termsRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/quotation-terms', require('./routes/quotation_terms'));

app.get('/', (req, res) => {
    res.send('ANEX Tools API Running');
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
