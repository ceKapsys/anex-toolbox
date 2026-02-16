import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import api from '../lib/api';

const ServiceModal = ({ isOpen, service, onClose, onSave }) => {
    const [formData, setFormData] = useState(service || { name: '', description: '', shortcode: '' });

    useEffect(() => {
        setFormData(service || { name: '', description: '', shortcode: '' });
    }, [service]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        setFormData({ name: '', description: '', shortcode: '' });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">
                        {service?.id ? 'Edit Service' : 'Add Service'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Service Name</label>
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
                        <label className="block text-sm font-medium text-slate-700">Shortcode</label>
                        <input
                            type="text"
                            name="shortcode"
                            value={formData.shortcode}
                            onChange={handleChange}
                            required
                            placeholder="e.g., DP, DV, WEB"
                            className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
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
                            {service?.id ? 'Update' : 'Add'} Service
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Services = () => {
    const [services, setServices] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState(null);

    const loadServices = async () => {
        try {
            const response = await api.get('/services');
            setServices(Array.isArray(response) ? response : []);
        } catch (err) {
            console.error('Error loading services:', err);
        }
    };

    useEffect(() => {
        loadServices();
    }, []);

    const handleOpenModal = (service = null) => {
        setSelectedService(service);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedService(null);
    };

    const handleSave = async (formData) => {
        try {
            if (selectedService?.id) {
                await api.patch(`/services/${selectedService.id}`, formData);
            } else {
                await api.post('/services', formData);
            }
            handleCloseModal();
            await loadServices();
        } catch (err) {
            console.error('Error saving service:', err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this service?')) {
            try {
                await api.delete(`/services/${id}`);
                await loadServices();
            } catch (err) {
                console.error('Error deleting service:', err);
            }
        }
    };

    return (
        <div className="min-h-full px-10 py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Services</h1>
                    <p className="text-sm text-slate-500">Manage service types and shortcodes.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0f0f10] px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                >
                    <Plus className="h-4 w-4" /> Add Service
                </button>
            </div>

            <div className="rounded-[28px] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="py-3 text-left font-medium text-slate-600">Service Name</th>
                                <th className="py-3 text-left font-medium text-slate-600">Shortcode</th>
                                <th className="py-3 text-left font-medium text-slate-600">Description</th>
                                <th className="py-3 text-left font-medium text-slate-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.map((service) => (
                                <tr key={service.id} className="border-t border-slate-100 hover:bg-slate-50">
                                    <td className="py-3 font-medium text-slate-900">{service.name}</td>
                                    <td className="py-3">
                                        <span className="inline-block rounded bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                            {service.shortcode}
                                        </span>
                                    </td>
                                    <td className="py-3 text-slate-600">{service.description}</td>
                                    <td className="py-3">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleOpenModal(service)}
                                                className="text-slate-400 hover:text-slate-600"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(service.id)}
                                                className="text-slate-400 hover:text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ServiceModal
                isOpen={modalOpen}
                service={selectedService}
                onClose={handleCloseModal}
                onSave={handleSave}
            />
        </div>
    );
};

export default Services;
