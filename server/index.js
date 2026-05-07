require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');


const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet());

// Cookie parser
app.use(cookieParser());

// CORS configuration
const allowedOrigins = [
    'http://localhost:5173',
    'https://anex-toolbox.vercel.app',
    'https://anex-toolbox-qxqi.vercel.app',
    'https://toolbox.anexbusiness.com'
];
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (server-to-server, curl, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        // Reject unlisted origins without throwing (avoids 500)
        return callback(null, false);
    },
    credentials: true
}));

// Global rate limiter
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // limit each IP to 500 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});
app.use(globalLimiter);

// Stricter rate limiter for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 auth attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts, please try again later.' }
});

app.use(bodyParser.json({ limit: '10mb' }));

// Routes
const clientsRoutes = require('./routes/clients');
const invoicesRoutes = require('./routes/invoices');
const quotationsRoutes = require('./routes/quotations');
const settingsRoutes = require('./routes/settings');
const servicesRoutes = require('./routes/services');
const termsRoutes = require('./routes/terms');
const emailRoutes = require('./routes/email');
const { router: authRoutes } = require('./routes/auth');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/quotations', quotationsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/terms', termsRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/quotation-terms', require('./routes/quotation_terms'));
app.use('/api/backup', require('./routes/backup'));

// Health check (minimal info)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.send('ANEX Tools API Running');
});


if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
