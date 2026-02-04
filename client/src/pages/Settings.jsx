import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Upload } from 'lucide-react';
import api from '../lib/api';

const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

const Settings = () => {
    const [settings, setSettings] = useState({
        company_details: {
            name: '',
            address: '',
            email: '',
            phone: '',
            logo: ''
        },
        bank_details: [],
        company_logo: '',
        quotation_header: '',
        quotation_footer: '',
        bank_logo: '',
        terms_invoice: '',
        terms_quote: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await api.settings.get();

            // Ensure data structure exists even if empty
            setSettings({
                company_details: data.company_details || { name: '', address: '', email: '', phone: '', logo: '' },
                bank_details: Array.isArray(data.bank_details) ? data.bank_details : [],
                company_logo: data.company_logo || '',
                quotation_header: data.quotation_header || '',
                quotation_footer: data.quotation_footer || '',
                bank_logo: data.bank_logo || '',
                terms_invoice: data.terms_invoice || '',
                terms_quote: data.terms_quote || ''
            });
        } catch (error) {
            console.error('Error fetching settings:', error);
            setMessage({ type: 'error', text: 'Failed to load settings.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (key, value) => {
        setSaving(true);
        setMessage(null);
        try {
            await api.settings.update(key, value);

            setMessage({ type: 'success', text: 'Settings saved successfully.' });

            // Update local state to reflect saved changes clearly (optional as we already have state)
            setSettings(prev => ({ ...prev, [key]: value }));

        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: 'Failed to save settings.' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleCompanyChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            company_details: { ...prev.company_details, [name]: value }
        }));
    };

    const handleAssetUpload = async (key, file) => {
        if (!file) return;
        const base64 = await fileToBase64(file);
        setSettings(prev => ({ ...prev, [key]: base64 }));
    };

    const addBank = () => {
        setSettings(prev => ({
            ...prev,
            bank_details: [...prev.bank_details, { bank_name: '', account_name: '', account_number: '', iban: '' }]
        }));
    };

    const removeBank = (index) => {
        setSettings(prev => ({
            ...prev,
            bank_details: prev.bank_details.filter((_, i) => i !== index)
        }));
    };

    const handleBankChange = (index, field, value) => {
        const newBanks = [...settings.bank_details];
        newBanks[index] = { ...newBanks[index], [field]: value };
        setSettings(prev => ({ ...prev, bank_details: newBanks }));
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Loading settings...</div>;

    return (
        <div className="min-h-full px-10 py-8 space-y-8">
            <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>

            {message && (
                <div className={`p-4 rounded-lg mb-6 ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {message.text}
                </div>
            )}

            {/* Company Details */}
            <section className="bg-white p-6 rounded-[28px] shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-slate-800">Company Details</h2>
                    <button
                        onClick={() => handleSave('company_details', settings.company_details)}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-[#0f0f10] text-white rounded-full text-xs font-semibold disabled:opacity-50"
                    >
                        <Save size={18} /> Save
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                        <input
                            type="text"
                            name="name"
                            value={settings.company_details.name}
                            onChange={handleCompanyChange}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={settings.company_details.email}
                            onChange={handleCompanyChange}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                            type="text"
                            name="phone"
                            value={settings.company_details.phone}
                            onChange={handleCompanyChange}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                        <input
                            type="text"
                            name="logo"
                            value={settings.company_details.logo}
                            onChange={handleCompanyChange}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <textarea
                            name="address"
                            value={settings.company_details.address}
                            onChange={handleCompanyChange}
                            rows="3"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm resize-none"
                        ></textarea>
                    </div>
                </div>
            </section>

            {/* Branding Assets */}
            <section className="bg-white p-6 rounded-[28px] shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-slate-800">Branding Assets</h2>
                    <button
                        onClick={() => {
                            handleSave('company_logo', settings.company_logo);
                            handleSave('quotation_header', settings.quotation_header);
                            handleSave('quotation_footer', settings.quotation_footer);
                            handleSave('bank_logo', settings.bank_logo);
                        }}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-[#0f0f10] text-white rounded-full text-xs font-semibold disabled:opacity-50"
                    >
                        <Save size={18} /> Save Assets
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Company Logo</label>
                        <input type="file" accept="image/*" onChange={(e) => handleAssetUpload('company_logo', e.target.files?.[0])} />
                        {settings.company_logo && <img src={settings.company_logo} alt="Company Logo" className="h-16 object-contain" />}
                    </div>
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Bank Logo</label>
                        <input type="file" accept="image/*" onChange={(e) => handleAssetUpload('bank_logo', e.target.files?.[0])} />
                        {settings.bank_logo && <img src={settings.bank_logo} alt="Bank Logo" className="h-16 object-contain" />}
                    </div>
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Quotation Header</label>
                        <input type="file" accept="image/*" onChange={(e) => handleAssetUpload('quotation_header', e.target.files?.[0])} />
                        {settings.quotation_header && <img src={settings.quotation_header} alt="Quotation Header" className="h-20 w-full object-contain" />}
                    </div>
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Quotation Footer</label>
                        <input type="file" accept="image/*" onChange={(e) => handleAssetUpload('quotation_footer', e.target.files?.[0])} />
                        {settings.quotation_footer && <img src={settings.quotation_footer} alt="Quotation Footer" className="h-20 w-full object-contain" />}
                    </div>
                </div>
            </section>

            {/* Bank Details */}
            <section className="bg-white p-6 rounded-[28px] shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-slate-800">Bank Accounts</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={addBank}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold"
                        >
                            <Plus size={18} /> Add Bank
                        </button>
                        <button
                            onClick={() => handleSave('bank_details', settings.bank_details)}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-[#0f0f10] text-white rounded-full text-xs font-semibold disabled:opacity-50"
                        >
                            <Save size={18} /> Save
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {settings.bank_details.map((bank, index) => (
                        <div key={index} className="p-4 bg-[#fbf9f7] rounded-2xl relative group border border-slate-100">
                            <button
                                onClick={() => removeBank(index)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={18} />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Bank Name</label>
                                    <input
                                        type="text"
                                        value={bank.bank_name}
                                        onChange={(e) => handleBankChange(index, 'bank_name', e.target.value)}
                                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Account Name</label>
                                    <input
                                        type="text"
                                        value={bank.account_name}
                                        onChange={(e) => handleBankChange(index, 'account_name', e.target.value)}
                                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Account Number</label>
                                    <input
                                        type="text"
                                        value={bank.account_number}
                                        onChange={(e) => handleBankChange(index, 'account_number', e.target.value)}
                                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">IBAN / SWIFT</label>
                                    <input
                                        type="text"
                                        value={bank.iban}
                                        onChange={(e) => handleBankChange(index, 'iban', e.target.value)}
                                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    {settings.bank_details.length === 0 && (
                        <p className="text-gray-400 text-center py-4">No bank accounts added yet.</p>
                    )}
                </div>
            </section>

            {/* Default Terms */}
            <section className="bg-white p-6 rounded-[28px] shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-slate-800">Default Terms</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">Invoice Terms</label>
                            <button
                                onClick={() => handleSave('terms_invoice', settings.terms_invoice)}
                                disabled={saving}
                                className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                            >
                                Save
                            </button>
                        </div>
                        <textarea
                            value={settings.terms_invoice}
                            onChange={(e) => setSettings(prev => ({ ...prev, terms_invoice: e.target.value }))}
                            rows="6"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
                        ></textarea>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">Quotation Terms</label>
                            <button
                                onClick={() => handleSave('terms_quote', settings.terms_quote)}
                                disabled={saving}
                                className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                            >
                                Save
                            </button>
                        </div>
                        <textarea
                            value={settings.terms_quote}
                            onChange={(e) => setSettings(prev => ({ ...prev, terms_quote: e.target.value }))}
                            rows="6"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
                        ></textarea>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Settings;
