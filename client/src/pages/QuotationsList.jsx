import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Eye, Download, Send, Copy, Trash2, Search, FileText, Check, X, MoreHorizontal, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import SendMailModal from '../components/email/SendMailModal';
import { downloadQuotationPDF, getQuotationPDFBlob } from '../utils/quotationPdfMake';

const QuotationsList = () => {
    const [quotations, setQuotations] = useState([]);
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [stats, setStats] = useState({
        total: { count: 0, amount: 0 },
        passed: { count: 0, amount: 0 },
        rejected: { count: 0, amount: 0 }
    });
    const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
    const [workOrderNumber, setWorkOrderNumber] = useState('');
    const [selectedQuotationId, setSelectedQuotationId] = useState(null);
    const [mailModal, setMailModal] = useState({ isOpen: false, quotation: null });
    const [settings, setSettings] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);

    const loadQuotations = async () => {
        try {
            const documents = await api.quotations.list();
            const data = documents.map(doc => ({
                id: doc.$id || doc.id,
                ...doc
            }));
            setQuotations(data || []);
            calculateStats(data || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadQuotations();
        const loadSettings = async () => {
            try {
                const s = await api.get('/settings');
                setSettings(s || {});
            } catch (err) {
                console.error('Error loading settings:', err);
            }
        };
        loadSettings();
    }, []);

    const calculateStats = (data) => {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        const newStats = {
            total: { count: 0, amount: 0 },
            passed: { count: 0, amount: 0 },
            rejected: { count: 0, amount: 0 }
        };

        data.forEach(q => {
            const date = new Date(q.date);
            const amount = Number(q.total) || 0;

            if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                newStats.total.count += 1;
                newStats.total.amount += amount;

                if (q.status === 'Passed') {
                    newStats.passed.count += 1;
                    newStats.passed.amount += amount;
                } else if (q.status === 'Rejected') {
                    newStats.rejected.count += 1;
                    newStats.rejected.amount += amount;
                }
            }
        });

        setStats(newStats);
    };

    const handleStatusChange = async (id, newStatus) => {
        if (newStatus === 'Passed') {
            setSelectedQuotationId(id);
            setWorkOrderNumber('');
            setShowWorkOrderModal(true);
        } else {
            try {
                const updatedQuotations = quotations.map(q =>
                    q.id === id ? { ...q, status: newStatus } : q
                );
                setQuotations(updatedQuotations);
                calculateStats(updatedQuotations);

                await api.quotations.update(id, { status: newStatus });
            } catch (err) {
                console.error(err);
                loadQuotations();
            }
        }
    };

    const handleConfirmWorkOrder = async () => {
        if (!workOrderNumber.trim()) {
            alert('Please enter a Work Order Number');
            return;
        }

        try {
            const updatedQuotations = quotations.map(q =>
                q.id === selectedQuotationId
                    ? { ...q, status: 'Passed', work_order_number: workOrderNumber }
                    : q
            );
            setQuotations(updatedQuotations);
            calculateStats(updatedQuotations);

            await api.quotations.update(selectedQuotationId, {
                status: 'Passed',
                work_order_number: workOrderNumber
            });

            setShowWorkOrderModal(false);
            setWorkOrderNumber('');
            setSelectedQuotationId(null);
        } catch (err) {
            console.error(err);
            alert('Failed to update quotation');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this quotation?')) return;
        try {
            await api.delete(`/quotations/${id}`);
            loadQuotations();
        } catch (err) {
            console.error(err);
        }
    };

    const handleSendEmail = async (mailData) => {
        try {
            const quotation = mailModal.quotation;

            let validityDate = quotation.valid_till_date;
            if (!validityDate && quotation.date) {
                const date = new Date(quotation.date);
                const validDate = new Date(date);
                validDate.setDate(date.getDate() + 30);
                validityDate = validDate.toISOString().split('T')[0];
            }

            const quotationNumber = quotation.quotation_number || `QT-${quotation.id}`;
            const subtotal = (quotation.items || []).reduce(
                (sum, item) => sum + ((item.qty || 1) * (item.price || 0)), 0
            );
            const vatPct = quotation.vat || 15;

            const pdfBuildData = {
                quotation_number: quotationNumber,
                quotation_date: quotation.date,
                valid_till_date: validityDate || '',
                client: {
                    name: quotation.to_company || '',
                    address: quotation.to_address || '',
                    attention: quotation.attn || '',
                },
                header_image: settings?.quotation_header || '',
                footer_image: settings?.quotation_footer || '',
                items: quotation.items || [],
                vat_percentage: vatPct,
                subtotal,
                vat_amount: subtotal * (vatPct / 100),
                grand_total: quotation.total || 0,
                terms_conditions: quotation.terms || '',
                contact_details: (() => {
                    const sigs = Array.isArray(settings?.signatories) ? settings.signatories : [];
                    const matched = sigs.find(s => s.name?.trim().toLowerCase() === quotation.contact_name?.trim().toLowerCase());
                    return matched || {
                        name: quotation.contact_name || '',
                        designation: '',
                        phone: '',
                        email: '',
                    };
                })(),
                disclaimer: settings?.quotation_disclaimer || '',
            };

            // Generate PDF as Blob for email attachment
            const pdfBlob = await getQuotationPDFBlob(pdfBuildData);

            // Send as multipart form data
            const formData = new FormData();
            formData.append('quotation_id', quotation.id);
            formData.append('to', mailData.to);
            if (mailData.cc) formData.append('cc', mailData.cc);
            formData.append('subject', mailData.subject);
            formData.append('body', mailData.body);
            formData.append('pdf', pdfBlob, `${quotationNumber}.pdf`);

            await api.email.sendQuotation(formData);
            alert('Quotation sent successfully!');
            setMailModal({ isOpen: false, quotation: null });
            await loadQuotations();
        } catch (err) {
            console.error('Failed to send quotation email:', err);
            throw err;
        }
    };

    const openMailModal = (quotation) => {
        setMailModal({ isOpen: true, quotation });
    };

    const handleDownload = async (quotation) => {
        if (!quotation) return;

        setDownloadingId(quotation.id);

        try {
            let validityDate = quotation.valid_till_date;
            if (!validityDate && quotation.date) {
                const date = new Date(quotation.date);
                const validDate = new Date(date);
                validDate.setDate(date.getDate() + 30);
                validityDate = validDate.toISOString().split('T')[0];
            }

            const quotationNumber = quotation.quotation_number || `QT-${quotation.id}`;
            const subtotal = (quotation.items || []).reduce(
                (sum, item) => sum + ((item.qty || 1) * (item.price || 0)), 0
            );
            const vatPct = quotation.vat || 15;

            const data = {
                quotation_number: quotationNumber,
                quotation_date: quotation.date,
                valid_till_date: validityDate || '',
                client: {
                    name: quotation.to_company || '',
                    address: quotation.to_address || '',
                    attention: quotation.attn || '',
                },
                header_image: settings?.quotation_header || '',
                footer_image: settings?.quotation_footer || '',
                items: quotation.items || [],
                vat_percentage: vatPct,
                subtotal,
                vat_amount: subtotal * (vatPct / 100),
                grand_total: quotation.total || 0,
                terms_conditions: quotation.terms || '',
                contact_details: (() => {
                    const sigs = Array.isArray(settings?.signatories) ? settings.signatories : [];
                    const matched = sigs.find(s => s.name?.trim().toLowerCase() === quotation.contact_name?.trim().toLowerCase());
                    return matched || {
                        name: quotation.contact_name || '',
                        designation: '',
                        phone: '',
                        email: '',
                    };
                })(),
                disclaimer: settings?.quotation_disclaimer || '',
            };

            await downloadQuotationPDF(data, `${quotationNumber}.pdf`);
        } catch (err) {
            console.error('PDF generation failed:', err);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setDownloadingId(null);
        }
    };

    const formatCurrency = (amount) => {
        return `${(Number(amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    };

    // Filter quotations
    const filteredQuotations = quotations.filter(q => {
        const matchesFilter = filter === 'All' ||
            (filter === 'In Process' && (q.status === 'Draft' || q.status === 'In Process')) ||
            q.status === filter;
        const matchesSearch = !search ||
            q.to_company?.toLowerCase().includes(search.toLowerCase()) ||
            q.quotation_number?.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const filters = ['All', 'In Process', 'Sent', 'Passed', 'Rejected'];

    const getStatusBadge = (status) => {
        const styles = {
            'Draft': 'bg-slate-100 text-slate-600 border-slate-200',
            'In Process': 'bg-amber-50 text-amber-700 border-amber-200',
            'Sent': 'bg-blue-50 text-blue-700 border-blue-200',
            'Passed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
            'Rejected': 'bg-rose-50 text-rose-700 border-rose-200'
        };
        return styles[status] || styles['Draft'];
    };

    return (
        <div className="min-h-full px-10 py-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Quotations</h1>
                    <p className="text-sm text-slate-500">Create and manage quotations.</p>
                </div>
                <Link to="/quotations/new" className="inline-flex items-center gap-2 rounded-full bg-[#0f0f10] px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800">
                    <Plus className="h-4 w-4" /> New Quotation
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Quotations"
                    count={stats.total.count}
                    amount={stats.total.amount}
                    icon={FileText}
                    color="blue"
                    formatCurrency={formatCurrency}
                />
                <StatCard
                    title="Passed Quotations"
                    count={stats.passed.count}
                    amount={stats.passed.amount}
                    icon={Check}
                    color="green"
                    formatCurrency={formatCurrency}
                />
                <StatCard
                    title="Rejected Quotations"
                    count={stats.rejected.count}
                    amount={stats.rejected.amount}
                    icon={X}
                    color="red"
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
                        placeholder="Search client or ref..."
                        className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 w-64"
                    />
                </div>
            </div>

            {/* Quotation Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredQuotations.map((qt) => (
                    <div key={qt.id} className="bg-white rounded-xl border border-red-500 p-5 hover:shadow-md transition flex flex-col">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-900 truncate">
                                    Quote for {qt.to_company || 'Unknown Client'}
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5 truncate">
                                    {qt.quotation_number || `QT-${qt.id}`} • {qt.to_company}
                                </p>
                            </div>
                            <div className="ml-3 flex-shrink-0">
                                <select
                                    value={qt.status || 'Draft'}
                                    onChange={(e) => handleStatusChange(qt.id, e.target.value)}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-md border cursor-pointer focus:outline-none ${getStatusBadge(qt.status)}`}
                                >
                                    <option value="Draft">Draft</option>
                                    <option value="In Process">In Process</option>
                                    <option value="Sent">Sent</option>
                                    <option value="Passed">Passed</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 text-sm gap-4">
                            <div className="flex-1">
                                <p className="text-xs text-slate-400 uppercase tracking-wide">Created</p>
                                <p className="font-medium text-slate-700">{formatDate(qt.date)}</p>
                            </div>
                            <div className="md:text-right">
                                <p className="text-xs text-slate-400 uppercase tracking-wide">Total</p>
                                <p className="font-semibold text-slate-900">{formatCurrency(qt.total)}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 mt-auto">
                            <Link
                                to={`/quotations/new?id=${qt.id}`}
                                className="flex-1 min-w-fit flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition font-medium"
                            >
                                <Edit2 className="h-3.5 w-3.5" /> Edit
                            </Link>
                            <button
                                onClick={() => handleDownload(qt)}
                                disabled={downloadingId === qt.id}
                                className="flex-1 min-w-fit flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition font-medium disabled:opacity-60"
                            >
                                {downloadingId === qt.id ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Downloading...
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-3.5 w-3.5" /> Download
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => openMailModal(qt)}
                                className="flex-1 min-w-fit flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition font-medium"
                            >
                                <Send className="h-3.5 w-3.5" /> Send
                            </button>
                            <button
                                onClick={() => handleDelete(qt.id)}
                                className="flex-1 min-w-fit flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition font-medium"
                            >
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                        </div>
                    </div>
                ))}

                {filteredQuotations.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-400">
                        No quotations found. Create your first quotation!
                    </div>
                )}
            </div>

            {/* Work Order Modal */}
            {showWorkOrderModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">Enter Work Order Number</h2>
                        <p className="text-sm text-slate-500 mb-6">This quotation is being marked as Passed. Please enter the corresponding Work Order Number.</p>

                        <input
                            type="text"
                            value={workOrderNumber}
                            onChange={(e) => setWorkOrderNumber(e.target.value)}
                            placeholder="e.g., WO-2026-0001"
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
                            autoFocus
                        />

                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setShowWorkOrderModal(false);
                                    setWorkOrderNumber('');
                                    setSelectedQuotationId(null);
                                }}
                                className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmWorkOrder}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <SendMailModal
                isOpen={mailModal.isOpen}
                onClose={() => setMailModal({ isOpen: false, quotation: null })}
                onSend={handleSendEmail}
                docType="quotation"
                clientEmail={mailModal.quotation?.attn_email || ''}
                docNumber={mailModal.quotation?.quotation_number || (mailModal.quotation?.id ? `QT-${mailModal.quotation.id}` : '')}
                defaultSubject={settings?.quotation_mail_subject || ''}
                defaultBody={settings?.quotation_mail_template || ''}
            />
        </div>
    );
};

const StatCard = ({ title, count, amount, icon: Icon, color, formatCurrency }) => {
    const colorClasses = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', iconBg: 'bg-blue-100' },
        green: { bg: 'bg-emerald-50', text: 'text-emerald-600', iconBg: 'bg-emerald-100' },
        red: { bg: 'bg-rose-50', text: 'text-rose-600', iconBg: 'bg-rose-100' }
    };
    const c = colorClasses[color] || colorClasses.blue;

    return (
        <div className="bg-white p-6 rounded-[28px] border border-red-500 shadow-[0_18px_40px_rgba(15,23,42,0.06)] hover:shadow-[0_24px_50px_rgba(15,23,42,0.08)] transition flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-2xl ${c.iconBg}`}>
                    <Icon className={`w-5 h-5 ${c.text}`} />
                </div>
                <MoreHorizontal className="w-5 h-5 text-slate-300 cursor-pointer flex-shrink-0" />
            </div>
            <p className="text-slate-500 text-sm mb-2">{title}</p>
            <div className="flex items-end gap-2 mb-3">
                <h3 className="text-2xl font-semibold text-slate-800">{count}</h3>
                <span className="text-xs text-slate-400">qtys</span>
            </div>
            <h4 className={`text-lg font-medium ${c.text} mt-auto`}>{formatCurrency(amount)}</h4>
        </div>
    );
};

export default QuotationsList;
