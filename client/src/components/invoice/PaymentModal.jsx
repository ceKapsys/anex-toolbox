import React, { useState } from 'react';

const PaymentModal = ({ isOpen, onClose, onSubmit, invoice }) => {
    const [data, setData] = useState({
        amount_paid: invoice?.totals_data?.due_amount || 0,
        vds: 0,
        tds: 0,
        cogs: invoice?.cogs || 0,
        payment_date: new Date().toISOString().split('T')[0]
    });

    if (!isOpen) return null;

    const handleSubmit = () => {
        onSubmit(data);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Mark as Paid</h3>
                <p className="text-xs text-slate-500 mb-4">Invoice: {invoice?.invoice_no}</p>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Payment Date</label>
                        <input
                            type="date"
                            value={data.payment_date}
                            onChange={(e) => setData({ ...data, payment_date: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Amount Paid (Received)</label>
                        <input
                            type="number"
                            value={data.amount_paid}
                            onChange={(e) => setData({ ...data, amount_paid: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">VDS Deducted</label>
                            <input
                                type="number"
                                value={data.vds}
                                onChange={(e) => setData({ ...data, vds: e.target.value })}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">TDS/AIT Deducted</label>
                            <input
                                type="number"
                                value={data.tds}
                                onChange={(e) => setData({ ...data, tds: e.target.value })}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">COGS (Optional Update)</label>
                        <input
                            type="number"
                            value={data.cogs}
                            onChange={(e) => setData({ ...data, cogs: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                        />
                    </div>
                </div>

                <div className="mt-6 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition">Cancel</button>
                    <button onClick={handleSubmit} className="flex-1 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-black rounded-xl transition">Confirm</button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
