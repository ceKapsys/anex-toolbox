const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const multer = require('multer');
const invoiceRepository = require('../repositories/InvoiceRepository');
const quotationRepository = require('../repositories/QuotationRepository');
const settingRepository = require('../repositories/SettingRepository');
const { isAuthenticated } = require('./auth');

// Multer: keep uploaded PDF in memory (no disk writes)
// Only allow PDF files
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

// Conservative HTML sanitizer for outbound email bodies. Strips elements that
// can execute code or hijack rendering (script, style, iframe, object, embed,
// link, meta, base, form), removes inline event handlers (on*=), and disarms
// `javascript:` URLs in href/src/action attributes.
const sanitizeEmailHtml = (html) => {
    if (typeof html !== 'string' || !html.trim()) return null;
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
        .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
        .replace(/<embed\b[^>]*>/gi, '')
        .replace(/<link\b[^>]*>/gi, '')
        .replace(/<meta\b[^>]*>/gi, '')
        .replace(/<base\b[^>]*>/gi, '')
        .replace(/\s+on\w+\s*=\s*"[^"]*"/gi, '')
        .replace(/\s+on\w+\s*=\s*'[^']*'/gi, '')
        .replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '')
        .replace(/(href|src|action|formaction|xlink:href)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1=$2#$2')
        .replace(/(href|src|action|formaction|xlink:href)\s*=\s*javascript:[^\s>]+/gi, '$1=#');
};

// Read SMTP config from settings DB
const getSmtpConfig = async () => {
    const rows = await settingRepository.findAll();
    const settings = {};
    rows.forEach(r => {
        try {
            settings[r.key] = JSON.parse(r.value);
        } catch (e) {
            settings[r.key] = r.value;
        }
    });

    const smtpConfig = settings.smtp_config || {};
    return {
        host: smtpConfig.host || 'smtp.office365.com',
        port: smtpConfig.port || 587,
        secure: smtpConfig.secure || false,
        fromName: settings.mail_from_name || 'ANEX ERP',
        fromEmail: smtpConfig.email || settings.mail_from_email || '',
        auth: {
            user: smtpConfig.email || settings.mail_from_email || '',
            pass: smtpConfig.password || ''
        }
    };
};

// Create nodemailer transporter from settings
const createTransporter = async () => {
    const config = await getSmtpConfig();
    return {
        transporter: nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: config.auth
        }),
        config
    };
};

// Send invoice email (multipart: fields + optional pdf file)
router.post('/send-invoice', isAuthenticated, upload.single('pdf'), async (req, res) => {
    try {
        const { invoice_id, to, cc, subject, body } = req.body;

        if (!invoice_id || !to) {
            return res.status(400).json({ error: 'Invoice ID and recipient email are required' });
        }

        const invoice = await invoiceRepository.findById(invoice_id);
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const { transporter, config } = await createTransporter();

        const attachments = [];
        if (req.file) {
            attachments.push({
                filename: req.file.originalname || `${invoice.invoice_no}.pdf`,
                content: req.file.buffer,
            });
        }

        const sanitizedBody = sanitizeEmailHtml(body) || '<p>Please find the attached invoice.</p>';

        const mailOptions = {
            from: `"${config.fromName}" <${config.fromEmail}>`,
            to: to,
            cc: cc || undefined,
            subject: subject || `Invoice ${invoice.invoice_no}`,
            html: sanitizedBody,
            attachments,
        };

        await transporter.sendMail(mailOptions);
        await invoiceRepository.update(invoice_id, { status: 'Sent' });

        res.json({ message: 'Invoice sent successfully', invoice_no: invoice.invoice_no });
    } catch (error) {
        console.error('Email sending error:', error);
        res.status(500).json({ error: 'Failed to send invoice email' });
    }
});

// Send quotation email (multipart: fields + optional pdf file)
router.post('/send-quotation', isAuthenticated, upload.single('pdf'), async (req, res) => {
    try {
        const { quotation_id, to, cc, subject, body } = req.body;

        if (!quotation_id || !to) {
            return res.status(400).json({ error: 'Quotation ID and recipient email are required' });
        }

        const quotation = await quotationRepository.findById(quotation_id);
        if (!quotation) {
            return res.status(404).json({ error: 'Quotation not found' });
        }

        const { transporter, config } = await createTransporter();

        const attachments = [];
        if (req.file) {
            attachments.push({
                filename: req.file.originalname || `Quotation-${quotation.id}.pdf`,
                content: req.file.buffer,
            });
        }

        const sanitizedBody = sanitizeEmailHtml(body) || '<p>Please find the attached quotation.</p>';

        const mailOptions = {
            from: `"${config.fromName}" <${config.fromEmail}>`,
            to: to,
            cc: cc || undefined,
            subject: subject || `Quotation for ${quotation.to_company}`,
            html: sanitizedBody,
            attachments,
        };

        await transporter.sendMail(mailOptions);
        await quotationRepository.update(quotation_id, { status: 'Sent' });

        res.json({ message: 'Quotation sent successfully' });
    } catch (error) {
        console.error('Email sending error:', error);
        res.status(500).json({ error: 'Failed to send quotation email' });
    }
});

// Test SMTP connection
router.post('/test-smtp', isAuthenticated, async (req, res) => {
    try {
        const { transporter } = await createTransporter();
        await transporter.verify();
        res.json({ message: 'SMTP connection successful' });
    } catch (error) {
        console.error('SMTP test error:', error);
        res.status(500).json({ error: 'SMTP connection failed' });
    }
});

module.exports = router;
