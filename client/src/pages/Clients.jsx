import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, AlertCircle, X, Check, Save } from 'lucide-react';
import api from '../lib/api';

const ClientEditModal = ({ isOpen, client, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        address: '',
        bin: '',
        attn: '',
        email: '',
        phone: ''
    });

    useEffect(() => {
        if (client) {
            setFormData({
                name: client.name || '',
                company: client.company || client.name || '',
                address: client.address || '',
                bin: client.bin || '',
                attn: client.attn || '',
                email: client.email || '',
                phone: client.phone || ''
            });
        }
    }, [client]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(client.id, formData);
    };

    if (!isOpen || !client) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Edit Client</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-600 mb-1">Client / Company Name <span className="text-red-500">*</span></label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-600 mb-1">Address <span className="text-red-500">*</span></label>
                            <input
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                required
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">BIN Number</label>
                            <input
                                name="bin"
                                value={formData.bin}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Contact Person (Attn) <span className="text-red-500">*</span></label>
                            <input
                                name="attn"
                                value={formData.attn}
                                onChange={handleChange}
                                required
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                            <input
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-xl bg-[#0f0f10] px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
                        >
                            <Save className="h-4 w-4" /> Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Clients = () => {
    const [clients, setClients] = useState([]);
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [editingClient, setEditingClient] = useState(null);

    // Add Client Form State
    const [form, setForm] = useState({
        name: '',
        address: '',
        bin: '',
        attn: '',
        email: '',
        phone: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            // First, migrate any clients without client_code
            try {
                await api.post('/clients/migrate-codes', {});
            } catch (e) {
                // Ignore migration errors, proceed with fetch
            }

            const [clientsRes, quotationsRes] = await Promise.all([
                api.clients.list(),
                api.quotations.list()
            ]);
            // Sort clients alphabetically by name
            const sortedClients = Array.isArray(clientsRes)
                ? clientsRes.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                : [];
            setClients(sortedClients);
            setQuotations(Array.isArray(quotationsRes) ? quotationsRes : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Calculate quotation stats per client
    const getClientQuotationStats = (clientId, clientName) => {
        const clientQuotations = quotations.filter(q =>
            q.client_id === clientId ||
            (q.to_company && q.to_company.toLowerCase() === clientName?.toLowerCase())
        );
        const total = clientQuotations.length;
        const passed = clientQuotations.filter(q => q.status === 'Passed').length;
        return { total, passed };
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.name.trim()) {
            setError('Client Name is required');
            return;
        }
        if (!form.address.trim()) {
            setError('Client Address is required');
            return;
        }
        if (!form.attn.trim()) {
            setError('Contact Person Name is required');
            return;
        }

        try {
            const response = await api.clients.create({
                ...form,
                company: form.name
            });

            if (response.error) {
                setError(response.error);
                return;
            }

            setForm({ name: '', address: '', bin: '', attn: '', email: '', phone: '' });
            fetchData();
        } catch (err) {
            console.error(err);
            if (err.message.includes('already exists')) {
                setError('A client with this name already exists.');
            } else {
                setError('Failed to add client. Please try again.');
            }
        }
    };

    const handleEditClick = (client) => {
        setEditingClient(client);
    };

    const handleUpdateClient = async (id, updatedData) => {
        try {
            await api.clients.update(id, {
                ...updatedData,
                company: updatedData.name // Sync company name
            });
            setEditingClient(null);
            fetchData();
        } catch (err) {
            console.error('Failed to update client:', err);
            alert('Failed to update client. Please try again.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this client?')) return;
        try {
            await api.clients.delete(id);
            fetchData();
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

            {/* Add Client Form - Full Width */}
            <form onSubmit={handleAdd} className="rounded-[28px] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Add New Client</h2>
                    <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-[#0f0f10] px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800">
                        <Plus className="h-4 w-4" /> Add Client
                    </button>
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm mb-4">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Client Name <span className="text-red-500">*</span></label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Enter client/company name"
                            required
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">BIN Number</label>
                        <input
                            name="bin"
                            value={form.bin}
                            onChange={handleChange}
                            placeholder="Business Identification Number"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Contact Person <span className="text-red-500">*</span></label>
                        <input
                            name="attn"
                            value={form.attn}
                            onChange={handleChange}
                            placeholder="Primary contact person"
                            required
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Contact Email</label>
                        <input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="email@company.com"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Contact Phone</label>
                        <input
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="+880 1XXX-XXXXXX"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Client Address <span className="text-red-500">*</span></label>
                        <input
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            placeholder="Full business address"
                            required
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                        />
                    </div>
                </div>

                <p className="text-xs text-slate-400 mt-3">
                    A unique Client ID will be auto-generated (e.g., A7X3K9)
                </p>
            </form>

            {/* Client List - Card Design */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Client List</h2>
                    <span className="text-xs text-slate-400">{loading ? 'Loading...' : `${clients.length} clients`}</span>
                </div>

                {clients.length === 0 && !loading ? (
                    <div className="rounded-[28px] bg-white p-10 shadow-[0_18px_40px_rgba(15,23,42,0.06)] text-center text-slate-400">
                        No clients added yet. Add your first client using the form above.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {clients.map((client) => {
                            const stats = getClientQuotationStats(client.id, client.name);
                            return (
                                <div key={client.id} className="rounded-[28px] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] hover:shadow-[0_24px_50px_rgba(15,23,42,0.10)] transition-shadow">
                                    {/* Header: Client Name & ID */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-semibold text-slate-800 truncate">{client.name}</h3>
                                            <span className="inline-block mt-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 font-mono text-xs font-semibold" title="Client Code">
                                                {client.client_code || '-'}
                                            </span>
                                        </div>
                                        <div className="flex gap-1 ml-2 flex-shrink-0">
                                            <button
                                                onClick={() => handleEditClick(client)}
                                                className="inline-flex items-center justify-center rounded-full bg-slate-100 p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                                                title="Edit"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(client.id)}
                                                className="inline-flex items-center justify-center rounded-full bg-slate-100 p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* BIN Number - Displayed prominently */}
                                    {client.bin && (
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 bg-slate-50 px-2 py-1 rounded-md w-fit">
                                            <span className="font-semibold text-slate-600">BIN:</span>
                                            <span className="font-mono text-slate-700">{client.bin}</span>
                                        </div>
                                    )}

                                    {/* Address */}
                                    {client.address && (
                                        <div className="text-xs text-slate-500 mb-3 line-clamp-2">
                                            <span className="font-medium text-slate-600">Address:</span> {client.address}
                                        </div>
                                    )}

                                    {/* Contact Info */}
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 mb-4 pt-3 border-t border-slate-100">
                                        {client.attn && (
                                            <div>
                                                <span className="text-slate-400">Contact:</span> <span className="font-medium">{client.attn}</span>
                                            </div>
                                        )}
                                        {client.phone && (
                                            <div>
                                                <span className="text-slate-400">Phone:</span> <span className="font-medium">{client.phone}</span>
                                            </div>
                                        )}
                                        {client.email && (
                                            <div>
                                                <span className="text-slate-400">Email:</span> <span className="font-medium">{client.email}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Quotation Stats */}
                                    <div className="flex gap-3 pt-3 border-t border-slate-100">
                                        <div className="flex-1 text-center rounded-xl bg-blue-50 py-2">
                                            <div className="text-lg font-bold text-blue-600">{stats.total}</div>
                                            <div className="text-[10px] text-blue-500 font-medium uppercase">Quotations</div>
                                        </div>
                                        <div className="flex-1 text-center rounded-xl bg-green-50 py-2">
                                            <div className="text-lg font-bold text-green-600">{stats.passed}</div>
                                            <div className="text-[10px] text-green-500 font-medium uppercase">Passed</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <ClientEditModal
                isOpen={!!editingClient}
                client={editingClient}
                onClose={() => setEditingClient(null)}
                onSave={handleUpdateClient}
            />
        </div>
    );
};

export default Clients;
