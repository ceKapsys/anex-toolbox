import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Download, Eye, Save } from 'lucide-react';
import InvoiceTemplate from '../components/templates/InvoiceTemplate';
import { generatePDF } from '../utils/pdfGenerator';
import { numberToWords } from '../utils/numberToWords';
import api from '../lib/api';

const InvoiceGenerator = () => {
    const templateRef = useRef();
    const [saving, setSaving] = useState(false);
    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState('');

    // Initial State
    const [data, setData] = useState({
        invoice_no: 'INV-' + new Date().getFullYear() + '-001',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time_f: new Date().toLocaleTimeString('en-US'),
        client: {
            name: '',
            bin: '',
            address: ''
        },
        items: [
            { desc: 'Consultancy Service', unit: 'Month', qty: 1, price: 20000, sd: 0, vat: 15, base_total: 20000, sd_amount: 0, vat_amount: 3000, line_total: 23000 }
        ],
        total_qty: 1,
        total_ex_vat: 20000,
        total_sd: 0,
        total_vat: 3000,
        due_amount: 23000,
        adjust_amount: 0,
        adjust_note: '',
        amount_in_words: 'Twenty Three Thousand',
        company_details: {
            name: 'ANEX Business Solutions',
            bin: '123456789',
            address: 'Dhaka, Bangladesh'
        },
        company_logo: '', // Add placeholder if needed
        bank_details: {
            bank: 'Dutch Bangla Bank',
            ac_name: 'ANEX Business',
            ac_no: '123.123.1234',
            routing: 'DBBLBDDH',
            logo: ''
        },
        terms: '1. Payment must be made by Cross Cheque/BEFTN/Pay Order.\n2. VAT & Tax Challan will be provided upon payment.',
        disclaimer: 'This is a system generated invoice.'
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
                const bankDetailsRaw = s.bank_details;
                const bankDetails = Array.isArray(bankDetailsRaw)
                    ? (bankDetailsRaw[0] || {})
                    : (bankDetailsRaw || {});

                setData(prev => ({
                    ...prev,
                    company_details: s.company_details || prev.company_details,
                    company_logo: s.company_logo || s.company_details?.logo || prev.company_logo,
                    bank_details: {
                        ...prev.bank_details,
                        ...bankDetails,
                        logo: s.bank_logo || bankDetails.logo || prev.bank_details.logo
                    },
                    terms: s.terms_invoice || prev.terms
                }));
            } catch (err) {
                console.error(err);
            }
        };
        loadClients();
        loadSettings();
    }, []);

    // Calculate totals
    useEffect(() => {
        let t_qty = 0, t_base = 0, t_sd = 0, t_vat = 0, t_gross = 0;

        const updatedItems = data.items.map(item => {
            const qty = Number(item.qty) || 0;
            const price = Number(item.price) || 0;
            const sd_rate = Number(item.sd) || 0;
            const vat_rate = Number(item.vat) || 0;

            const base = qty * price;
            const sd = base * (sd_rate / 100);
            const vat = (base + sd) * (vat_rate / 100);
            const total = base + sd + vat;

            t_qty += qty;
            t_base += base;
            t_sd += sd;
            t_vat += vat;
            t_gross += total;

            return {
                ...item,
                base_total: base,
                sd_amount: sd,
                vat_amount: vat,
                line_total: total
            };
        });

        const due = t_gross - (Number(data.adjust_amount) || 0);

        setData(prev => ({
            ...prev,
            items: updatedItems,
            total_qty: t_qty,
            total_ex_vat: t_base,
            total_sd: t_sd,
            total_vat: t_vat,
            due_amount: due,
            amount_in_words: numberToWords(due)
        }));
    }, [JSON.stringify(data.items.map(i => [i.qty, i.price, i.sd, i.vat])), data.adjust_amount]);

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
                    bin: client.bin || '',
                    address: client.address || ''
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
            items: [...data.items, { desc: '', unit: 'Pcs', qty: 1, price: 0, sd: 0, vat: 0, base_total: 0, sd_amount: 0, vat_amount: 0, line_total: 0 }]
        });
    };

    const removeItem = (index) => {
        const newItems = data.items.filter((_, i) => i !== index);
        setData({ ...data, items: newItems });
    };

    const downloadPDF = () => {
        generatePDF(templateRef.current, `${data.invoice_no}.pdf`);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Map to backend schema
            const payload = {
                invoice_no: data.invoice_no,
                invoice_type: 'Regular',
                client_id: selectedClientId ? Number(selectedClientId) : 0,
                client_snapshot: data.client,
                bank_snapshot: data.bank_details,
                items_data: data.items,
                totals_data: {
                    total_qty: data.total_qty,
                    total_ex_vat: data.total_ex_vat,
                    total_sd: data.total_sd,
                    total_vat: data.total_vat,
                    due_amount: data.due_amount
                },
                adjustment_amount: data.adjust_amount,
                adjustment_note: data.adjust_note,
                issue_date: data.issue_date,
                due_date: data.due_date,
                approved_by: 'Admin',
                status: 'Draft'
            };

            await api.invoices.create(payload);
            setSaving(false);
            alert('Invoice saved successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to save invoice.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-140px)] gap-8">
            {/* Editor Sidebar */}
            <div className="w-1/2 flex flex-col rounded-[28px] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)] overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-[#fbf9f7] flex justify-between items-center">
                    <h2 className="font-semibold text-slate-800">Invoice Editor</h2>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="h-10 w-10 inline-flex items-center justify-center rounded-full bg-white text-slate-600 shadow-sm hover:text-slate-800 disabled:opacity-50"
                        title="Save Draft"
                    >
                        <Save className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* General */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Invoice No</label>
                            <input
                                value={data.invoice_no}
                                onChange={e => setData({ ...data, invoice_no: e.target.value })}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Issue Date</label>
                            <input
                                type="date"
                                value={data.issue_date}
                                onChange={e => setData({ ...data, issue_date: e.target.value })}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            />
                        </div>
                    </div>

                    {/* Client */}
                    <div className="space-y-4 border-t pt-4">
                        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Client</h3>
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
                        <input
                            name="name" placeholder="Name"
                            value={data.client.name} onChange={handleClientChange}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        />
                        <input
                            name="bin" placeholder="BIN Number"
                            value={data.client.bin} onChange={handleClientChange}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        />
                        <textarea
                            name="address" placeholder="Address"
                            value={data.client.address} onChange={handleClientChange}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        />
                    </div>

                    {/* Items */}
                    <div className="space-y-4 border-t pt-4">
                        <div className="flex justify-between">
                            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Items</h3>
                            <button onClick={addItem} className="text-slate-700 text-xs font-semibold flex items-center gap-1 hover:text-slate-900"><Plus className="w-3 h-3" /> Add</button>
                        </div>
                        {data.items.map((item, idx) => (
                            <div key={idx} className="bg-[#fbf9f7] p-4 rounded-2xl border border-slate-100 relative group">
                                <button onClick={() => removeItem(idx)} className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                                <input
                                    placeholder="Description"
                                    value={item.desc}
                                    onChange={e => handleItemChange(idx, 'desc', e.target.value)}
                                    className="w-full text-sm font-semibold border-b border-slate-200 bg-transparent mb-3 focus:outline-none"
                                />
                                <div className="grid grid-cols-4 gap-2">
                                    <input type="number" placeholder="Qty" value={item.qty} onChange={e => handleItemChange(idx, 'qty', e.target.value)} className="text-sm border border-slate-200 bg-white px-2 py-1.5 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-slate-200" />
                                    <input type="number" placeholder="Price" value={item.price} onChange={e => handleItemChange(idx, 'price', e.target.value)} className="text-sm border border-slate-200 bg-white px-2 py-1.5 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-slate-200" />
                                    <input type="number" placeholder="SD%" value={item.sd} onChange={e => handleItemChange(idx, 'sd', e.target.value)} className="text-sm border border-slate-200 bg-white px-2 py-1.5 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-slate-200" />
                                    <input type="number" placeholder="VAT%" value={item.vat} onChange={e => handleItemChange(idx, 'vat', e.target.value)} className="text-sm border border-slate-200 bg-white px-2 py-1.5 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-slate-200" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Adjustment */}
                    <div className="grid grid-cols-2 gap-4 border-t pt-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500">Adjustment Amount</label>
                            <input
                                type="number"
                                value={data.adjust_amount}
                                onChange={e => setData({ ...data, adjust_amount: e.target.value })}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500">Adjustment Note</label>
                            <input
                                value={data.adjust_note}
                                onChange={e => setData({ ...data, adjust_note: e.target.value })}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Panel */}
            <div className="w-1/2 flex flex-col rounded-[28px] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)] overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="font-semibold text-slate-800 flex items-center gap-2"><Eye className="w-4 h-4 text-slate-400" /> Preview</h2>
                    <button onClick={downloadPDF} className="bg-[#0f0f10] hover:bg-black text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition">
                        <Download className="w-4 h-4" /> Download PDF
                    </button>
                </div>
                <div className="flex-1 overflow-auto p-8 bg-[#f6f3f1] flex justify-center">
                    <div className="origin-top transform scale-[0.65] shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                        <InvoiceTemplate ref={templateRef} data={data} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceGenerator;
