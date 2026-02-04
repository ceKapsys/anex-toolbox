import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Download, Eye, Save } from 'lucide-react';
import QuotationTemplate from '../components/templates/QuotationTemplate';
import { generatePDF } from '../utils/pdfGenerator';
import clsx from 'clsx';
import api from '../lib/api';

const QuotationGenerator = () => {
    const templateRef = useRef();
    const [activeTab, setActiveTab] = useState('edit'); // edit | preview
    const [saving, setSaving] = useState(false);
    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState('');

    // Initial State
    const [data, setData] = useState({
        quotation_number: 'AQB-GEN-' + new Date().getMonth() + 1 + '-001',
        quotation_date: new Date().toISOString().split('T')[0],
        valid_till_date: '', // Will be calc
        client: {
            name: '',
            address: '',
            attention: ''
        },
        items: [
            { title: 'Web Development Service', description: 'Full stack development', qty: 1, unit: 'Job', price: 50000, line_total: 50000 }
        ],
        vat_percentage: 15,
        subtotal: 50000,
        vat_amount: 7500,
        grand_total: 57500,
        terms_conditions: '• 50% Advance payment required.\n• Delivery within 15 working days.',
        contact_details: {
            name: 'John Doe',
            designation: 'Manager',
            phone: '+880 123 456 7890',
            email: 'info@anexbusiness.com'
        },
        header_image: '', // Placeholder or fetch from settings
        footer_image: '',
        disclaimer: 'This is a computer generated quotation.'
    });

    useEffect(() => {
        const loadClients = async () => {
            try {
                const documents = await api.clients.list();
                const clients_data = documents.map(doc => ({
                    id: doc.$id,
                    ...doc
                }));
                setClients(clients_data || []);
            } catch (err) {
                console.error(err);
            }
        };
        const loadSettings = async () => {
            try {
                const s = await api.settings.get();
                setData(prev => ({
                    ...prev,
                    header_image: s.quotation_header || prev.header_image,
                    footer_image: s.quotation_footer || prev.footer_image,
                    terms_conditions: s.terms_quote || prev.terms_conditions
                }));
            } catch (err) {
                console.error(err);
            }
        };
        loadClients();
        loadSettings();
    }, []);

    // Calculate totals when items change
    useEffect(() => {
        const subtotal = data.items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.price)), 0);
        const vat = subtotal * (Number(data.vat_percentage) / 100);
        const total = subtotal + vat;

        // Also update line totals
        const updatedItems = data.items.map(item => ({
            ...item,
            line_total: Number(item.qty) * Number(item.price)
        }));

        // Avoid infinite loop by checking if values actually changed (simplified here)
        // For now, just set data if totals differ, but mapped items might cause loop if not careful.
        // Better: calculate these on render or in the handler. 
        // But for "live" preview data, we need them in state.

        setData(prev => ({
            ...prev,
            subtotal,
            vat_amount: vat,
            grand_total: total,
            items: updatedItems
        }));
    }, [JSON.stringify(data.items.map(i => [i.qty, i.price])), data.vat_percentage]);

    const handleClientChange = (e) => {
        setData({ ...data, client: { ...data.client, [e.target.name]: e.target.value } });
    };

    const handleClientSelect = (e) => {
        const id = e.target.value;
        setSelectedClientId(id);
        const client = clients.find((c) => String(c.id) === String(id));
        if (client) {
            setData({
                ...data,
                client: {
                    name: client.name || client.company || '',
                    address: client.address || '',
                    attention: client.attn || ''
                }
            });
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...data.items];
        newItems[index][field] = value;
        setData({ ...data, items: newItems });
    };

    const addItem = () => {
        setData({
            ...data,
            items: [...data.items, { title: '', description: '', qty: 1, unit: 'Pcs', price: 0, line_total: 0 }]
        });
    };

    const removeItem = (index) => {
        const newItems = data.items.filter((_, i) => i !== index);
        setData({ ...data, items: newItems });
    };

    const downloadPDF = () => {
        generatePDF(templateRef.current, `${data.quotation_number}.pdf`);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Map to backend schema
            const payload = {
                client_id: selectedClientId ? Number(selectedClientId) : 0,
                to_company: data.client.name,
                to_address: data.client.address,
                attn: data.client.attention,
                type: 'GEN',
                date: data.quotation_date,
                vat: data.vat_percentage,
                discount: 0,
                items: data.items,
                terms: data.terms_conditions,
                contact_name: data.contact_details.name,
                total: data.grand_total,
                status: 'Draft'
            };

            await api.quotations.create(payload);
            setSaving(false);
            alert('Quotation saved successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to save quotation.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-140px)] gap-8">
            {/* Editor Sidebar */}
            <div className="w-1/2 flex flex-col rounded-[28px] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)] overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-[#fbf9f7] flex justify-between items-center">
                    <h2 className="font-semibold text-slate-800">Editor</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="h-10 w-10 inline-flex items-center justify-center rounded-full bg-white text-slate-600 shadow-sm hover:text-slate-800 disabled:opacity-50"
                            title="Save Draft"
                        >
                            <Save className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* General Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider border-b pb-1">General Info</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Quote Number</label>
                                <input
                                    type="text"
                                    value={data.quotation_number}
                                    onChange={e => setData({ ...data, quotation_number: e.target.value })}
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={data.quotation_date}
                                    onChange={e => setData({ ...data, quotation_date: e.target.value })}
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Client Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider border-b pb-1">Client Details</h3>
                        <select
                            value={selectedClientId}
                            onChange={handleClientSelect}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        >
                            <option value="">Select saved client (optional)</option>
                            {clients.map((client) => (
                                <option key={client.id} value={client.id}>{client.name}</option>
                            ))}
                        </select>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Client Name</label>
                            <input
                                name="name"
                                value={data.client.name}
                                onChange={handleClientChange}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Address</label>
                            <textarea
                                name="address"
                                value={data.client.address}
                                onChange={handleClientChange}
                                rows={2}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Attention (Optional)</label>
                            <input
                                name="attention"
                                value={data.client.attention}
                                onChange={handleClientChange}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            />
                        </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-1">
                            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Line Items</h3>
                            <button onClick={addItem} className="text-slate-700 hover:text-slate-900 text-xs font-semibold flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Add Item
                            </button>
                        </div>

                        <div className="space-y-3">
                            {data.items.map((item, idx) => (
                                <div key={idx} className="bg-[#fbf9f7] p-4 rounded-2xl border border-slate-100 relative group">
                                    <button
                                        onClick={() => removeItem(idx)}
                                        className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <div className="grid grid-cols-12 gap-3">
                                        <div className="col-span-8">
                                            <input
                                                placeholder="Item Title"
                                                value={item.title}
                                                onChange={e => handleItemChange(idx, 'title', e.target.value)}
                                                className="w-full text-sm font-semibold border-slate-200 rounded-xl bg-white px-3 py-2 mb-2 border"
                                            />
                                            <textarea
                                                placeholder="Description"
                                                value={item.description}
                                                onChange={e => handleItemChange(idx, 'description', e.target.value)}
                                                rows={2}
                                                className="w-full text-xs border-slate-200 rounded-xl bg-white px-3 py-2 border"
                                            />
                                        </div>
                                        <div className="col-span-4 space-y-2">
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    placeholder="Qty"
                                                    value={item.qty}
                                                    onChange={e => handleItemChange(idx, 'qty', e.target.value)}
                                                    className="w-1/2 text-sm text-center border-slate-200 rounded-xl bg-white px-3 py-2 border"
                                                />
                                                <input
                                                    placeholder="Unit"
                                                    value={item.unit}
                                                    onChange={e => handleItemChange(idx, 'unit', e.target.value)}
                                                    className="w-1/2 text-sm text-center border-slate-200 rounded-xl bg-white px-3 py-2 border"
                                                />
                                            </div>
                                            <input
                                                type="number"
                                                placeholder="Price"
                                                value={item.price}
                                                onChange={e => handleItemChange(idx, 'price', e.target.value)}
                                                className="w-full text-sm text-right font-mono border-slate-200 rounded-xl bg-white px-3 py-2 border"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totals & VAT */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider border-b pb-1">Calculations</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">VAT Percentage (%)</label>
                                <input
                                    type="number"
                                    value={data.vat_percentage}
                                    onChange={e => setData({ ...data, vat_percentage: e.target.value })}
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                                />
                            </div>
                            <div className="bg-[#fbf9f7] p-4 rounded-2xl text-right">
                                <p className="text-xs text-slate-500">Grand Total</p>
                                <p className="text-lg font-semibold text-slate-900">{data.grand_total.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Terms */}
                    <div className="space-y-4 pb-10">
                        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider border-b pb-1">Footer & Terms</h3>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Terms & Conditions</label>
                            <textarea
                                value={data.terms_conditions}
                                onChange={e => setData({ ...data, terms_conditions: e.target.value })}
                                rows={4}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Panel */}
            <div className="w-1/2 flex flex-col rounded-[28px] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)] overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-slate-400" /> Live Preview
                    </h2>
                    <button
                        onClick={downloadPDF}
                        className="bg-[#0f0f10] hover:bg-black text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition"
                    >
                        <Download className="w-4 h-4" /> Download PDF
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-8 bg-[#f6f3f1] flex justify-center">
                    {/* Scale down the preview to fit */}
                    <div className="origin-top transform scale-[0.65] shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                        <QuotationTemplate ref={templateRef} data={data} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuotationGenerator;
