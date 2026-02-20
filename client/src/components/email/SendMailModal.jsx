import React, { useState, useEffect } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';

const SendMailModal = ({ isOpen, onClose, onSend, docType = 'invoice', clientEmail = '', docNumber = '', defaultSubject = '', defaultBody = '' }) => {
    const [formData, setFormData] = useState({
        to: '',
        cc: '',
        subject: '',
        body: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (clientEmail) {
            setFormData(prev => ({
                ...prev,
                to: clientEmail
            }));
        }

        // Use settings-based defaults if provided, otherwise use hardcoded fallback
        const subject = defaultSubject
            ? defaultSubject.replace('{{number}}', docNumber).replace('{{doc_number}}', docNumber)
            : (docType === 'invoice' ? `Invoice ${docNumber}` : `Quotation ${docNumber}`);

        const body = defaultBody || (docType === 'invoice'
            ? `<p>Dear Client,</p>
<p>Please find attached the invoice for your reference.</p>
<p>If you have any questions, please feel free to contact us.</p>
<p>Best regards,<br/>ANEX Team</p>`
            : `<p>Dear Client,</p>
<p>Please find attached the quotation for your reference.</p>
<p>If you have any questions, please feel free to contact us.</p>
<p>Best regards,<br/>ANEX Team</p>`);

        setFormData(prev => ({
            ...prev,
            subject: subject,
            body: body
        }));
    }, [isOpen, clientEmail, docType, docNumber, defaultSubject, defaultBody]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.to.trim()) {
            setError('Recipient email is required');
            return;
        }

        if (!validateEmail(formData.to)) {
            setError('Please enter a valid recipient email');
            return;
        }

        if (formData.cc && !validateEmail(formData.cc)) {
            setError('Please enter a valid CC email');
            return;
        }

        if (!formData.subject.trim()) {
            setError('Subject is required');
            return;
        }

        if (!formData.body.trim()) {
            setError('Email body is required');
            return;
        }

        setLoading(true);
        try {
            await onSend(formData);
            setFormData({
                to: '',
                cc: '',
                subject: '',
                body: ''
            });
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to send email');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-lg max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Send {docType === 'invoice' ? 'Invoice' : 'Quotation'}</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Recipient Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            name="to"
                            value={formData.to}
                            onChange={handleChange}
                            placeholder="client@example.com"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            CC Email (Optional)
                        </label>
                        <input
                            type="email"
                            name="cc"
                            value={formData.cc}
                            onChange={handleChange}
                            placeholder="cc@example.com"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Subject <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Email Body <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="body"
                            value={formData.body}
                            onChange={handleChange}
                            rows="8"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 font-mono text-xs"
                            placeholder="Enter email body in HTML format..."
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            You can use HTML formatting in the email body.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 px-4 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2 px-4 text-sm font-medium text-white bg-slate-900 hover:bg-black rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Send className="h-4 w-4" />
                            {loading ? 'Sending...' : 'Send Email'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SendMailModal;
