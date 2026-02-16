import React from 'react';
import { Plus, Trash2, Save } from 'lucide-react';

const InvoiceEditor = ({
    data, clients, services, terms, banks,
    updateField, updateClient, updateItem, addItem, removeItem, saveInvoice, saving
}) => {
    return (
        <div className="w-1/2 flex flex-col rounded-[28px] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)] overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-[#fbf9f7] flex justify-between items-center">
                <h2 className="font-semibold text-slate-800">Invoice Editor</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.location.reload()}
                        className="h-10 px-4 rounded-full bg-white text-slate-600 shadow-sm hover:text-slate-800 text-xs font-bold"
                    >
                        Reset
                    </button>
                    <button
                        onClick={saveInvoice}
                        disabled={saving}
                        className="h-10 w-10 inline-flex items-center justify-center rounded-full bg-green-500 text-white shadow-sm hover:bg-green-600 disabled:opacity-50"
                        title="Save Draft"
                    >
                        <Save className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Invoice Details */}
                <div className="space-y-4">

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Service Type</label>
                        <select
                            value={data.service_id || ''}
                            onChange={(e) => updateField('service_id', e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        >
                            <option value="">Select Service Type</option>
                            {services.map((service) => (
                                <option key={service.id} value={service.id}>{service.name} ({service.shortcode})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Invoice No</label>
                            <input
                                value={data.invoice_no}
                                onChange={e => updateField('invoice_no', e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Issue Date</label>
                            <input
                                type="date"
                                value={data.issue_date}
                                onChange={e => updateField('issue_date', e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Due Date</label>
                        <input
                            type="date"
                            value={data.due_date}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 cursor-not-allowed"
                            readOnly
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Work Order Number</label>
                        <input
                            type="text"
                            value={data.work_order_ref || ''}
                            onChange={e => updateField('work_order_ref', e.target.value)}
                            placeholder="e.g., WO-2026-0001"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        />
                    </div>
                </div>

                {/* Client */}
                <div className="space-y-4 border-t pt-4">
                    <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Client</h3>
                    <select
                        onChange={(e) => updateClient(e.target.value)}
                        value={data.client_id || ""}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    >
                        <option value="">Select Client</option>
                        {clients.map((client) => (
                            <option key={client.id} value={client.id}>{client.name || client.company}</option>
                        ))}
                    </select>

                    {data.client?.name && (
                        <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <p className="font-bold text-slate-800">{data.client.name}</p>
                            {data.client.company && <p>{data.client.company}</p>}
                            <p>{data.client.address}</p>
                        </div>
                    )}
                </div>

                {/* Items */}
                <div className="space-y-4 border-t pt-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Items</h3>
                        <button onClick={addItem} className="text-slate-700 text-xs font-semibold flex items-center gap-1 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition"><Plus className="w-3 h-3" /> Add Item</button>
                    </div>

                    {data.items.length > 0 && (
                        <div className="grid grid-cols-12 gap-2 px-2 mb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            <div className="col-span-12">Description</div>
                            <div className="col-span-2 text-center">Unit</div>
                            <div className="col-span-2 text-center">Qty</div>
                            <div className="col-span-2 text-center">Price</div>
                            <div className="col-span-3 text-center">SD%</div>
                            <div className="col-span-3 text-center">VAT%</div>
                        </div>
                    )}

                    {data.items.map((item, idx) => (
                        <div key={idx} className="bg-[#fbf9f7] p-4 rounded-2xl border border-slate-100 relative group">
                            <button onClick={() => removeItem(idx)} className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 p-1"><Trash2 className="w-4 h-4" /></button>

                            <div className="mb-3">
                                <label className="sr-only">Description</label>
                                <input
                                    placeholder="Item Description"
                                    value={item.desc}
                                    onChange={e => updateItem(idx, 'desc', e.target.value)}
                                    className="w-full text-sm font-semibold border-b border-slate-200 bg-transparent py-1 focus:outline-none focus:border-slate-400 placeholder:text-slate-300"
                                />
                            </div>

                            <div className="grid grid-cols-5 gap-2">
                                <div>
                                    <label className="block text-[10px] text-slate-400 text-center mb-1 lg:hidden">Unit</label>
                                    <input type="text" placeholder="Unit" value={item.unit || ''} onChange={e => updateItem(idx, 'unit', e.target.value)} className="w-full text-sm border border-slate-200 bg-white px-2 py-1.5 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-slate-200" />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-slate-400 text-center mb-1 lg:hidden">Qty</label>
                                    <input type="number" placeholder="Qty" value={item.qty} onChange={e => updateItem(idx, 'qty', e.target.value)} className="w-full text-sm border border-slate-200 bg-white px-2 py-1.5 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-slate-200" />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-slate-400 text-center mb-1 lg:hidden">Price</label>
                                    <input type="number" placeholder="Price" value={item.price} onChange={e => updateItem(idx, 'price', e.target.value)} className="w-full text-sm border border-slate-200 bg-white px-2 py-1.5 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-slate-200" />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-slate-400 text-center mb-1 lg:hidden">SD%</label>
                                    <input type="number" placeholder="SD" value={item.sd} onChange={e => updateItem(idx, 'sd', e.target.value)} className="w-full text-sm border border-slate-200 bg-white px-2 py-1.5 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-slate-200" />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-slate-400 text-center mb-1 lg:hidden">VAT%</label>
                                    <input type="number" placeholder="VAT" value={item.vat} onChange={e => updateItem(idx, 'vat', e.target.value)} className="w-full text-sm border border-slate-200 bg-white px-2 py-1.5 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-slate-200" />
                                </div>
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
                            onChange={e => updateField('adjust_amount', e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500">Adjustment Note</label>
                        <input
                            value={data.adjust_note}
                            onChange={e => updateField('adjust_note', e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        />
                    </div>
                </div>

                {/* Payment Bank */}
                <div className="space-y-4 border-t pt-4">
                    <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Payment Bank</h3>
                    {banks.length > 0 ? (
                        <select
                            value={data.selected_bank_id || 0}
                            onChange={(e) => updateField('selected_bank_id', parseInt(e.target.value))}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        >
                            {banks.map((bank, idx) => (
                                <option key={idx} value={idx}>{bank.bank || 'Bank'} - {bank.ac_no}</option>
                            ))}
                        </select>
                    ) : (
                        <p className="text-xs text-slate-500 italic">No bank details found in Settings.</p>
                    )}
                </div>

                {/* Terms & Conditions */}
                <div className="space-y-4 border-t pt-4">
                    <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Terms & Conditions</h3>

                    <div className="flex gap-4">
                        <div className="w-1/3 space-y-2 max-h-60 overflow-y-auto pr-2">
                            <p className="text-xs font-semibold text-slate-500 mb-2">Click to insert:</p>
                            {terms.filter(t => (t.type || 'invoice') === 'invoice').map((term) => (
                                <button
                                    key={term.id}
                                    onClick={() => {
                                        const bullet = `• ${term.description}`;
                                        const newText = data.terms_text ? `${data.terms_text}\n${bullet}` : bullet;
                                        updateField('terms_text', newText);
                                    }}
                                    className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-100 text-xs text-slate-700 transition"
                                >
                                    {term.name}
                                </button>
                            ))}
                            {terms.filter(t => (t.type || 'invoice') === 'invoice').length === 0 && (
                                <p className="text-xs text-slate-400 italic">No invoice terms found.</p>
                            )}
                        </div>

                        <div className="w-2/3">
                            <textarea
                                value={data.terms_text}
                                onChange={e => updateField('terms_text', e.target.value)}
                                rows={8}
                                placeholder="Terms will appear here..."
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            />
                        </div>
                    </div>
                </div>


            </div>
        </div>
    );
};

export default InvoiceEditor;
