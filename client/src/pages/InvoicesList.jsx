import React, { useEffect, useState } from 'react';
import { Plus, Download, Trash2, Edit2, X, Search, Send, FileText, DollarSign, CheckCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import SendMailModal from '../components/email/SendMailModal';
import { downloadInvoicePDF, getInvoicePDFBlob } from '../utils/invoicePdfMake';
import { numberToWords } from '../utils/numberToWords';

const PaymentModal = ({ isOpen, invoice, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        amount_paid: invoice?.amount_paid || 0,
        vds: invoice?.vds || 0,
        tds: invoice?.tds || 0,
        cogs: invoice?.cogs || 0,
        payment_date: invoice?.payment_date || new Date().toISOString().split('T')[0]
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'payment_date' ? value : parseFloat(value) || 0
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen || !invoice) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Payment Details</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Payment Date</label>
                        <input
                            type="date"
                            name="payment_date"
                            value={formData.payment_date}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Amount Paid</label>
                        <input
                            type="number"
                            name="amount_paid"
                            step="0.01"
                            value={formData.amount_paid}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-700">VDS</label>
                            <input
                                type="number"
                                name="vds"
                                step="0.01"
                                value={formData.vds}
                                onChange={handleChange}
                                className="mt-1 w-full rounded-xl border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700">TDS</label>
                            <input
                                type="number"
                                name="tds"
                                step="0.01"
                                value={formData.tds}
                                onChange={handleChange}
                                className="mt-1 w-full rounded-xl border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700">COGS</label>
                            <input
                                type="number"
                                name="cogs"
                                step="0.01"
                                value={formData.cogs}
                                onChange={handleChange}
                                className="mt-1 w-full rounded-xl border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 rounded-xl bg-[#0f0f10] px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                        >
                            Save Payment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const InvoicesList = () => {
    const [invoices, setInvoices] = useState([]);
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [paymentModal, setPaymentModal] = useState({ isOpen: false, invoice: null });
    const [mailModal, setMailModal] = useState({ isOpen: false, invoice: null });
    const [settings, setSettings] = useState(null);

    const loadInvoices = async () => {
        try {
            const response = await api.get('/invoices');
            setInvoices(Array.isArray(response) ? response : []);
        } catch (err) {
            console.error('Error loading invoices:', err);
        }
    };

    const loadSettings = async () => {
        try {
            const s = await api.get('/settings');
            setSettings(s || {});
        } catch (err) {
            console.error('Error loading settings:', err);
        }
    };

    useEffect(() => {
        loadInvoices();
        loadSettings();
    }, []);

    const handleStatusChange = async (id, newStatus) => {
        if (newStatus === 'Paid') {
            const invoice = invoices.find(inv => inv.id === id);
            setPaymentModal({ isOpen: true, invoice });
        } else {
            try {
                await api.patch(`/invoices/${id}/status`, { status: newStatus });
                await loadInvoices();
            } catch (err) {
                console.error('Error updating status:', err);
            }
        }
    };

    const handleSendEmail = async (mailData) => {
        const invoice = mailModal.invoice;
            const items = invoice.items_data || [];
            const totals = invoice.totals_data || {};
            const client = invoice.client_snapshot || {};
            const bankSnapshot = invoice.bank_snapshot || {};

            let bankDetails = {};
            if (Object.keys(bankSnapshot).length > 0) {
                bankDetails = bankSnapshot;
            } else {
                const bankDetailsArray = typeof settings.bank_details === 'string'
                    ? JSON.parse(settings.bank_details || '[]')
                    : (Array.isArray(settings.bank_details) ? settings.bank_details : []);
                if (bankDetailsArray.length > 0) {
                    bankDetails = {
                        ...bankDetailsArray[0],
                        logo: settings.bank_logo || bankDetailsArray[0]?.logo
                    };
                }
            }

            const companyDetails = typeof settings.company_details === 'string'
                ? JSON.parse(settings.company_details || '{}')
                : (settings.company_details || {});

            const pdfBuildData = {
                company_details: companyDetails,
                company_logo: settings.company_logo || companyDetails.logo || '',
                client: {
                    name: client.name || client.company || '',
                    bin: client.bin || '',
                    address: client.address || '',
                },
                invoice_no: invoice.invoice_no,
                issue_date: invoice.issue_date,
                due_date: invoice.due_date,
                time_f: '',
                quote_ref: invoice.quotation_ref,
                work_order_ref: invoice.work_order_ref,
                approved_by: invoice.approved_by,
                items: items,
                total_qty: totals.total_qty || 0,
                total_ex_vat: totals.total_ex_vat || 0,
                total_sd: totals.total_sd || 0,
                total_vat: totals.total_vat || 0,
                due_amount: totals.due_amount || 0,
                adjust_amount: invoice.adjustment_amount || 0,
                adjust_note: invoice.adjustment_note,
                amount_in_words: numberToWords(totals.due_amount || 0),
                terms_text: invoice.terms_text || '',
                bank_details: bankDetails,
                disclaimer: settings.invoice_disclaimer || '',
            };

            // Generate PDF as Blob for email attachment
            const pdfBlob = await getInvoicePDFBlob(pdfBuildData);

            // Send as multipart form data to avoid JSON base64 bloat
            const formData = new FormData();
            formData.append('invoice_id', invoice.id);
            formData.append('to', mailData.to);
            if (mailData.cc) formData.append('cc', mailData.cc);
            formData.append('subject', mailData.subject);
            formData.append('body', mailData.body);
            formData.append('pdf', pdfBlob, `${invoice.invoice_no || 'invoice'}.pdf`);

            await api.email.sendInvoice(formData);
            alert('Invoice sent successfully!');
            setMailModal({ isOpen: false, invoice: null });
            await loadInvoices();
    };

    const openMailModal = (invoice) => {
        setMailModal({ isOpen: true, invoice });
    };

    const handleSavePayment = async (paymentData) => {
        try {
            await api.patch(`/invoices/${paymentModal.invoice.id}/payment`, {
                ...paymentData,
                status: 'Paid'
            });
            setPaymentModal({ isOpen: false, invoice: null });
            await loadInvoices();
        } catch (err) {
            console.error('Error saving payment:', err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this invoice?')) {
            try {
                await api.delete(`/invoices/${id}`);
                await loadInvoices();
            } catch (err) {
                console.error('Error deleting invoice:', err);
            }
        }
    };

    const [downloadingId, setDownloadingId] = useState(null);

    const handleDownload = async (invoice) => {
        if (!settings) {
            alert('Settings not loaded yet. Please try again.');
            return;
        }

        setDownloadingId(invoice.id);

        try {
            const items = invoice.items_data || [];
            const totals = invoice.totals_data || {};
            const client = invoice.client_snapshot || {};
            const bankSnapshot = invoice.bank_snapshot || {};

            let bankDetails = {};
            if (Object.keys(bankSnapshot).length > 0) {
                bankDetails = bankSnapshot;
            } else {
                const bankDetailsArray = typeof settings.bank_details === 'string'
                    ? JSON.parse(settings.bank_details || '[]')
                    : (Array.isArray(settings.bank_details) ? settings.bank_details : []);
                if (bankDetailsArray.length > 0) {
                    bankDetails = {
                        ...bankDetailsArray[0],
                        logo: settings.bank_logo || bankDetailsArray[0]?.logo
                    };
                }
            }

            const companyDetails = typeof settings.company_details === 'string'
                ? JSON.parse(settings.company_details || '{}')
                : (settings.company_details || {});

            const data = {
                company_details: companyDetails,
                company_logo: settings.company_logo || companyDetails.logo || '',
                client: {
                    name: client.name || client.company || '',
                    bin: client.bin || '',
                    address: client.address || '',
                },
                invoice_no: invoice.invoice_no,
                issue_date: invoice.issue_date,
                due_date: invoice.due_date,
                time_f: '',
                quote_ref: invoice.quotation_ref,
                work_order_ref: invoice.work_order_ref,
                approved_by: invoice.approved_by,
                items: items,
                total_qty: totals.total_qty || 0,
                total_ex_vat: totals.total_ex_vat || 0,
                total_sd: totals.total_sd || 0,
                total_vat: totals.total_vat || 0,
                due_amount: totals.due_amount || 0,
                adjust_amount: invoice.adjustment_amount || 0,
                adjust_note: invoice.adjustment_note,
                amount_in_words: numberToWords(totals.due_amount || 0),
                terms_text: invoice.terms_text || '',
                bank_details: bankDetails,
                disclaimer: settings.invoice_disclaimer || '',
            };

            await downloadInvoicePDF(data, `${invoice.invoice_no || 'invoice'}.pdf`);
        } catch (err) {
            console.error('PDF generation failed:', err);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setDownloadingId(null);
        }
    };

    // Calculate metrics - Current Month Only
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const currentMonthInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.issue_date || inv.created_at);
        return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
    });

    // Calculate total amounts from all invoices in current month
    const totalReceivablesAmount = currentMonthInvoices.reduce((sum, inv) => {
        return sum + (inv.totals_data?.due_amount || 0);
    }, 0);

    const totalReceivedAmount = currentMonthInvoices.reduce((sum, inv) => {
        return sum + (inv.amount_paid || 0);
    }, 0);

    const metrics = {
        totalInvoices: currentMonthInvoices.length,
        totalReceivables: totalReceivablesAmount,
        paymentPending: totalReceivablesAmount - totalReceivedAmount,
        totalReceived: totalReceivedAmount,
        totalVDS: currentMonthInvoices.reduce((sum, inv) => sum + (inv.vds || 0), 0),
        totalTDS: currentMonthInvoices.reduce((sum, inv) => sum + (inv.tds || 0), 0)
    };

    const formatCurrency = (value) => {
        return `${new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value || 0)} BDT`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    };

    // Filter invoices
    const filteredInvoices = invoices.filter(inv => {
        const matchesFilter = filter === 'All' || inv.status === filter;
        const matchesSearch = !search ||
            inv.client_snapshot?.name?.toLowerCase().includes(search.toLowerCase()) ||
            inv.invoice_no?.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const filters = ['All', 'Draft', 'Submitted', 'Paid'];

    const getStatusBadge = (status) => {
        const styles = {
            'Draft': 'bg-slate-100 text-slate-600 border-slate-200',
            'Submitted': 'bg-blue-50 text-blue-700 border-blue-200',
            'Paid': 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
        return styles[status] || styles['Draft'];
    };

    return (
        <div className="min-h-full px-10 py-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Invoices</h1>
                    <p className="text-sm text-slate-500">Track, manage, and analyze invoices.</p>
                </div>
                <Link to="/invoices/new" className="inline-flex items-center gap-2 rounded-full bg-[#0f0f10] px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800">
                    <Plus className="h-4 w-4" /> New Invoice
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <StatCard
                    title="Total Receivables"
                    count={currentMonthInvoices.length}
                    amount={metrics.totalReceivables}
                    icon={FileText}
                    color="blue"
                    formatCurrency={formatCurrency}
                />
                <StatCard
                    title="Payment Pending"
                    count={currentMonthInvoices.filter(i => i.status === 'Submitted').length}
                    amount={metrics.paymentPending}
                    icon={DollarSign}
                    color="amber"
                    formatCurrency={formatCurrency}
                />
                <StatCard
                    title="Total Received"
                    count={currentMonthInvoices.filter(i => i.status === 'Paid').length}
                    amount={metrics.totalReceived}
                    icon={CheckCircle}
                    color="green"
                    formatCurrency={formatCurrency}
                />
                <StatCard
                    title="VAT Deducted"
                    count={currentMonthInvoices.filter(i => (i.vds || 0) > 0).length}
                    amount={metrics.totalVDS}
                    icon={FileText}
                    color="red"
                    formatCurrency={formatCurrency}
                />
                <StatCard
                    title="AIT Deducted"
                    count={currentMonthInvoices.filter(i => (i.tds || 0) > 0).length}
                    amount={metrics.totalTDS}
                    icon={FileText}
                    color="purple"
                    formatCurrency={formatCurrency}
                />
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                    {filters.map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 text-xs font-medium rounded-md transition ${filter === f
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search client or invoice..."
                        className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 w-64"
                    />
                </div>
            </div>

            {/* Invoice Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredInvoices.map((inv) => (
                    <div key={inv.id} className="bg-white rounded-xl border border-red-500 p-5 hover:shadow-md transition">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-900 truncate">
                                    Invoice for {inv.client_snapshot?.name || 'Unknown Client'}
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5 truncate">
                                    {inv.invoice_no} • {inv.client_snapshot?.name}
                                </p>
                            </div>
                            <div className="ml-3 flex-shrink-0">
                                <select
                                    value={inv.status || 'Draft'}
                                    onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-md border cursor-pointer focus:outline-none ${getStatusBadge(inv.status)}`}
                                >
                                    <option value="Draft">Draft</option>
                                    <option value="Submitted">Submitted</option>
                                    <option value="Paid">Paid</option>
                                </select>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex items-center justify-between mb-4 text-sm">
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wide">Issue Date</p>
                                <p className="font-medium text-slate-700">{formatDate(inv.issue_date)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400 uppercase tracking-wide">Amount</p>
                                <p className="font-semibold text-slate-900">{formatCurrency(inv.totals_data?.due_amount)}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            <Link
                                to={`/invoices/${inv.id}/edit`}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition font-medium"
                            >
                                <Edit2 className="h-3.5 w-3.5" /> Edit
                            </Link>
                            <button
                                onClick={() => handleDownload(inv)}
                                disabled={downloadingId === inv.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition font-medium disabled:opacity-60"
                            >
                                {downloadingId === inv.id ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-3.5 w-3.5" /> Download
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => openMailModal(inv)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition font-medium"
                            >
                                <Send className="h-3.5 w-3.5" /> Send
                            </button>
                            <button
                                onClick={() => handleDelete(inv.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition font-medium"
                            >
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                        </div>
                    </div>
                ))}

                {filteredInvoices.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-400">
                        No invoices found. Create your first invoice!
                    </div>
                )}
            </div>

            <PaymentModal
                isOpen={paymentModal.isOpen}
                invoice={paymentModal.invoice}
                onClose={() => setPaymentModal({ isOpen: false, invoice: null })}
                onSave={handleSavePayment}
            />

            <SendMailModal
                isOpen={mailModal.isOpen}
                onClose={() => setMailModal({ isOpen: false, invoice: null })}
                onSend={handleSendEmail}
                docType="invoice"
                clientEmail={mailModal.invoice?.client_snapshot?.email || ''}
                docNumber={mailModal.invoice?.invoice_no || ''}
                defaultSubject={settings?.invoice_mail_subject || ''}
                defaultBody={settings?.invoice_mail_template || ''}
            />
        </div>
    );
};

const StatCard = ({ title, count, amount, icon: Icon, color, formatCurrency }) => {
    const colorClasses = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', iconBg: 'bg-blue-100' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-600', iconBg: 'bg-amber-100' },
        green: { bg: 'bg-emerald-50', text: 'text-emerald-600', iconBg: 'bg-emerald-100' },
        red: { bg: 'bg-red-50', text: 'text-red-600', iconBg: 'bg-red-100' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-600', iconBg: 'bg-purple-100' }
    };
    const c = colorClasses[color] || colorClasses.blue;

    return (
        <div className="bg-white p-6 rounded-[28px] shadow-[0_18px_40px_rgba(15,23,42,0.06)] hover:shadow-[0_24px_50px_rgba(15,23,42,0.08)] transition">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-2xl ${c.iconBg}`}>
                    <Icon className={`w-5 h-5 ${c.text}`} />
                </div>
            </div>
            <p className="text-slate-500 text-sm mb-1">{title}</p>
            <div className="flex items-end gap-2 mb-2">
                <h3 className="text-2xl font-semibold text-slate-800">{count}</h3>
                <span className="text-xs text-slate-400 mb-1">invoices</span>
            </div>
            <h4 className={`text-lg font-medium ${c.text}`}>{formatCurrency(amount)}</h4>
        </div>
    );
};

export default InvoicesList;
