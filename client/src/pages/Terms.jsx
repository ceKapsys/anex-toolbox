import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import api from '../lib/api';

const TermModal = ({ isOpen, term, activeType, onClose, onSave }) => {
    const [formData, setFormData] = useState(term || { name: '', description: '' });

    useEffect(() => {
        setFormData(term || { name: '', description: '' });
    }, [term]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        setFormData({ name: '', description: '' });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900 capitalize">
                        {term?.id ? `Edit ${term.type || 'Invoice'} Term` : `Add ${activeType} Term`}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Term Title</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={4}
                            placeholder="Enter term details or conditions"
                            className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 rounded bg-[#0f0f10] px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                        >
                            {term?.id ? 'Update' : 'Add'} Term
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Terms = () => {
    const [invoiceTerms, setInvoiceTerms] = useState([]);
    const [quotationTerms, setQuotationTerms] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTerm, setSelectedTerm] = useState(null);
    const [activeType, setActiveType] = useState('invoice'); // 'invoice' or 'quotation'

    const loadTerms = async () => {
        try {
            const [invoiceRes, quotationRes] = await Promise.all([
                api.get('/terms'),
                api.get('/quotation-terms')
            ]);
            setInvoiceTerms(Array.isArray(invoiceRes) ? invoiceRes : []);
            setQuotationTerms(Array.isArray(quotationRes) ? quotationRes : []);
        } catch (err) {
            console.error('Error loading terms:', err);
        }
    };

    useEffect(() => {
        loadTerms();
    }, []);

    const handleOpenModal = (type, term = null) => {
        setActiveType(type);
        setSelectedTerm(term);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedTerm(null);
    };

    const handleSave = async (formData) => {
        try {
            const isQuote = activeType === 'quotation';
            const endpoint = isQuote ? '/quotation-terms' : '/terms';

            // For invoice terms, we might still send type='invoice' for backward compatibility 
            // but for quotation terms, the new table doesn't have a type column.
            const dataToSave = isQuote ? formData : { ...formData, type: 'invoice' };

            if (selectedTerm?.id) {
                await api.patch(`${endpoint}/${selectedTerm.id}`, dataToSave);
            } else {
                await api.post(endpoint, dataToSave);
            }
            handleCloseModal();
            await loadTerms();
        } catch (err) {
            console.error('Error saving term:', err);
        }
    };

    const handleDelete = async (id, type) => {
        if (window.confirm('Are you sure you want to delete this term?')) {
            try {
                const endpoint = type === 'quotation' ? '/quotation-terms' : '/terms';
                await api.delete(`${endpoint}/${id}`);
                await loadTerms();
            } catch (err) {
                console.error('Error deleting term:', err);
            }
        }
    };

    const TermList = ({ title, type, items }) => (
        <div className="flex-1 rounded-[28px] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] min-h-[500px]">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                    <p className="text-xs text-slate-500">Manage {type} terms</p>
                </div>
                <button
                    onClick={() => handleOpenModal(type)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0f0f10] px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                >
                    <Plus className="h-3 w-3" /> Add Term
                </button>
            </div>

            <div className="space-y-3">
                {items.length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-sm">No terms added yet.</div>
                )}
                {items.map((term) => (
                    <div key={term.id} className="group relative rounded-2xl border border-slate-100 bg-[#fbf9f7] p-4 transition hover:shadow-md">
                        <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition group-hover:opacity-100">
                            <button onClick={() => handleOpenModal(type, term)} className="text-slate-400 hover:text-slate-600"><Edit2 className="h-3.5 w-3.5" /></button>
                            <button onClick={() => handleDelete(term.id, type)} className="text-slate-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                        <h3 className="font-semibold text-slate-800 text-sm mb-1 pr-12">{term.name}</h3>
                        <p className="text-xs text-slate-600 line-clamp-3 whitespace-pre-wrap">{term.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="min-h-full px-10 py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Terms & Conditions</h1>
                    <p className="text-sm text-slate-500">Manage terms separately for Invoices and Quotations.</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                <TermList title="Invoice Terms" type="invoice" items={invoiceTerms} />
                <TermList title="Quotation Terms" type="quotation" items={quotationTerms} />
            </div>

            <TermModal
                isOpen={modalOpen}
                term={selectedTerm}
                activeType={activeType}
                onClose={handleCloseModal}
                onSave={handleSave}
            />
        </div>
    );
};

export default Terms;
