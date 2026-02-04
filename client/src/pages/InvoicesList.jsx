import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const InvoicesList = () => {
    const [invoices, setInvoices] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const documents = await api.invoices.list();
                const data = documents.map(doc => ({
                    id: doc.$id,
                    ...doc
                }));
                setInvoices(data || []);
            } catch (err) {
                console.error(err);
            }
        };
        load();
    }, []);

    return (
        <div className="min-h-full px-10 py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Invoices</h1>
                    <p className="text-sm text-slate-500">Track and generate invoices.</p>
                </div>
                <Link to="/invoices/new" className="inline-flex items-center gap-2 rounded-full bg-[#0f0f10] px-4 py-2 text-xs font-semibold text-white">
                    <Plus className="h-4 w-4" /> New Invoice
                </Link>
            </div>

            <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-slate-400">
                                <th className="py-2">Invoice No</th>
                                <th className="py-2">Issue Date</th>
                                <th className="py-2">Due Date</th>
                                <th className="py-2">Amount</th>
                                <th className="py-2">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-700">
                            {invoices.map((inv) => (
                                <tr key={inv.id} className="border-t border-slate-100">
                                    <td className="py-3 font-medium">{inv.invoice_no}</td>
                                    <td className="py-3">{inv.issue_date}</td>
                                    <td className="py-3">{inv.due_date}</td>
                                    <td className="py-3">{inv.totals_data?.due_amount || ''}</td>
                                    <td className="py-3">{inv.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InvoicesList;
