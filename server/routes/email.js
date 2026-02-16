const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const invoiceRepository = require('../repositories/InvoiceRepository');
const quotationRepository = require('../repositories/QuotationRepository');
const { isAuthenticated } = require('./auth');

// Hardcoded SMTP configuration (should be moved to settings/env in future)
const SMTP_CONFIG = {
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    fromName: 'Anex ERP',
    fromEmail: 'engine@anexbusiness.com',
    auth: {
        user: 'engine@anexbusiness.com',
        pass: 'dlvlzwcfjgxhjsmg'
    }
};

// Create nodemailer transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: SMTP_CONFIG.host,
        port: SMTP_CONFIG.port,
        secure: SMTP_CONFIG.secure,
        auth: SMTP_CONFIG.auth
    });
};

// Send invoice email
router.post('/send-invoice', isAuthenticated, async (req, res) => {
    try {
        const { invoice_id, to, cc, subject, body, pdf_data } = req.body;

        if (!invoice_id || !to) {
            return res.status(400).json({ error: 'Invoice ID and recipient email are required' });
        }

        // Get invoice details
        const invoice = await invoiceRepository.findById(invoice_id);

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Create transporter
        const transporter = await createTransporter();

        // Parse client snapshot for company name
        let companyName = 'ANEX';
        try {
            const clientSnapshot = JSON.parse(invoice.client_snapshot || '{}');
            companyName = clientSnapshot.company || clientSnapshot.name || 'ANEX';
        } catch (e) { }

        // Email options
        const mailOptions = {
            from: `"${SMTP_CONFIG.fromName}" <${SMTP_CONFIG.fromEmail}>`,
            to: to,
            cc: cc || undefined,
            subject: subject || `Invoice ${invoice.invoice_no}`,
            html: body || `<p>Please find the attached invoice.</p>`,
            attachments: pdf_data ? [
                {
                    filename: `${invoice.invoice_no}.pdf`,
                    content: pdf_data.replace(/^data:application\/pdf;base64,/, ''),
                    encoding: 'base64'
                }
            ] : []
        };

        // Send email
        await transporter.sendMail(mailOptions);

        // Update invoice status to 'Sent'
        await invoiceRepository.update(invoice_id, { status: 'Sent' });

        res.json({ message: 'Invoice sent successfully', invoice_no: invoice.invoice_no });
    } catch (error) {
        console.error('Email sending error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send quotation email
router.post('/send-quotation', isAuthenticated, async (req, res) => {
    try {
        const { quotation_id, to, cc, subject, body, pdf_data } = req.body;

        if (!quotation_id || !to) {
            return res.status(400).json({ error: 'Quotation ID and recipient email are required' });
        }

        // Get quotation details
        const quotation = await quotationRepository.findById(quotation_id);

        if (!quotation) {
            return res.status(404).json({ error: 'Quotation not found' });
        }

        // Create transporter
        const transporter = await createTransporter();

        // Email options
        const mailOptions = {
            from: `"${SMTP_CONFIG.fromName}" <${SMTP_CONFIG.fromEmail}>`,
            to: to,
            cc: cc || undefined,
            subject: subject || `Quotation for ${quotation.to_company}`,
            html: body || `<p>Please find the attached quotation.</p>`,
            attachments: pdf_data ? [
                {
                    filename: `Quotation-${quotation.id}.pdf`,
                    content: pdf_data.replace(/^data:application\/pdf;base64,/, ''),
                    encoding: 'base64'
                }
            ] : []
        };

        // Send email
        await transporter.sendMail(mailOptions);

        // Update quotation status to 'Sent'
        await quotationRepository.update(quotation_id, { status: 'Sent' });

        res.json({ message: 'Quotation sent successfully' });
    } catch (error) {
        console.error('Email sending error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Test SMTP connection
router.post('/test-smtp', isAuthenticated, async (req, res) => {
    try {
        const transporter = await createTransporter();
        await transporter.verify();
        res.json({ message: 'SMTP connection successful' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
