import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../lib/api';

const Clients = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        company: '',
        address: '',
        email: '',
        phone: '',
        attn: ''
    });

    const fetchClients = async () => {
        setLoading(true);
        try {
            const documents = await api.clients.list();
            const clients_data = documents.map(doc => ({
                id: doc.$id,
                ...doc
            }));
            setClients(clients_data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await api.clients.create(form);
            setForm({ name: '', company: '', address: '', email: '', phone: '', attn: '' });
            fetchClients();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.clients.delete(id);
            fetchClients();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-full px-10 py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Clients</h1>
                    <p className="text-sm text-slate-500">Create and manage your client list.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <form onSubmit={handleAdd} className="lg:col-span-1 rounded-[28px] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Add Client</h2>
                        <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-[#0f0f10] px-4 py-2 text-xs font-semibold text-white">
                            <Plus className="h-4 w-4" /> Add
                        </button>
                    </div>

                    <div className="space-y-3">
                        <input name="name" value={form.name} onChange={handleChange} placeholder="Client Name"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm" />
                        <input name="company" value={form.company} onChange={handleChange} placeholder="Company"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm" />
                        <textarea name="address" value={form.address} onChange={handleChange} placeholder="Address" rows={3}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm" />
                        <input name="email" value={form.email} onChange={handleChange} placeholder="Email"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm" />
                        <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm" />
                        <input name="attn" value={form.attn} onChange={handleChange} placeholder="Attention"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm" />
                    </div>
                </form>

                <div className="lg:col-span-2 rounded-[28px] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Client List</h2>
                        <span className="text-xs text-slate-400">{loading ? 'Loading...' : `${clients.length} clients`}</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-400">
                                    <th className="py-2">Name</th>
                                    <th className="py-2">Company</th>
                                    <th className="py-2">Email</th>
                                    <th className="py-2">Phone</th>
                                    <th className="py-2 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-700">
                                {clients.map((client) => (
                                    <tr key={client.id} className="border-t border-slate-100">
                                        <td className="py-3 font-medium">{client.name}</td>
                                        <td className="py-3">{client.company}</td>
                                        <td className="py-3">{client.email}</td>
                                        <td className="py-3">{client.phone}</td>
                                        <td className="py-3 text-right">
                                            <button
                                                onClick={() => handleDelete(client.id)}
                                                className="inline-flex items-center justify-center rounded-full bg-slate-100 p-2 text-slate-500 hover:text-rose-600"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Clients;
