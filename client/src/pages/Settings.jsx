import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import api from '../lib/api';

const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

const Settings = () => {
    const [settings, setSettings] = useState({
        menu_icon: '',
        company_logo: '',
        mail_from_name: '',
        mail_from_email: '',
        use_smtp: false,
        smtp_host: '',
        smtp_port: '587',
        smtp_user: '',
        smtp_password: '',
        company_details: {
            name: '',
            bin: '',
            address: ''
        },
        bank_details: [],
        quotation_header: '',
        quotation_footer: '',
        rubber_stamp: '',
        signatories: [],
        quotation_disclaimer: '',
        invoice_disclaimer: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [testingSmtp, setTestingSmtp] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await api.settings.get();

            // Helper function to safely parse settings
            const parseValue = (value) => {
                if (typeof value === 'string') {
                    try {
                        return JSON.parse(value);
                    } catch (e) {
                        return value;
                    }
                }
                return value;
            };

            // Handle SMTP config - can be stored as individual fields or as a combined object
            let smtpHost = data.smtp_host || '';
            let smtpPort = data.smtp_port || '587';
            let smtpUser = data.smtp_user || '';
            let smtpPassword = data.smtp_password || '';

            // If smtp_config is stored as an object, extract values from it
            if (data.smtp_config && typeof data.smtp_config === 'object') {
                smtpHost = data.smtp_config.host || smtpHost;
                smtpPort = data.smtp_config.port || smtpPort;
                smtpUser = data.smtp_config.email || smtpUser;
                smtpPassword = data.smtp_config.password || smtpPassword;
            } else if (data.smtp_config && typeof data.smtp_config === 'string') {
                try {
                    const config = JSON.parse(data.smtp_config);
                    smtpHost = config.host || smtpHost;
                    smtpPort = config.port || smtpPort;
                    smtpUser = config.email || smtpUser;
                    smtpPassword = config.password || smtpPassword;
                } catch (e) {
                    console.warn('Could not parse smtp_config', e);
                }
            }

            setSettings({
                menu_icon: data.menu_icon || '',
                company_logo: data.company_logo || '',
                mail_from_name: data.mail_from_name || '',
                mail_from_email: data.mail_from_email || '',
                use_smtp: data.use_smtp || false,
                smtp_host: smtpHost,
                smtp_port: smtpPort,
                smtp_user: smtpUser,
                smtp_password: smtpPassword,
                company_details: typeof data.company_details === 'object' ? data.company_details : (data.company_details ? parseValue(data.company_details) : { name: '', bin: '', address: '' }),
                bank_details: typeof data.bank_details === 'object' ? (Array.isArray(data.bank_details) ? data.bank_details : []) : (data.bank_details ? parseValue(data.bank_details) : []),
                quotation_header: data.quotation_header || '',
                quotation_footer: data.quotation_footer || '',
                rubber_stamp: data.rubber_stamp || '',
                signatories: typeof data.signatories === 'object' ? (Array.isArray(data.signatories) ? data.signatories : []) : (data.signatories ? parseValue(data.signatories) : []),
                quotation_disclaimer: data.quotation_disclaimer || '',
                invoice_disclaimer: data.invoice_disclaimer || ''
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
            setSettings(prev => ({ ...prev, [key]: value }));
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: 'Failed to save settings.' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleTestSMTP = async () => {
        setTestingSmtp(true);
        setMessage(null);
        try {
            // First save the SMTP config
            const smtpConfig = {
                host: settings.smtp_host,
                port: parseInt(settings.smtp_port) || 587,
                secure: parseInt(settings.smtp_port) === 465,
                email: settings.mail_from_email,
                password: settings.smtp_password
            };
            await api.settings.update('smtp_config', smtpConfig);
            
            // Test the connection
            await api.email.testSMTP();
            setMessage({ type: 'success', text: 'SMTP connection successful!' });
        } catch (error) {
            console.error('SMTP test error:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to connect to SMTP server.' });
        } finally {
            setTestingSmtp(false);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    const handleSaveSMTPConfig = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const smtpConfig = {
                host: settings.smtp_host,
                port: parseInt(settings.smtp_port) || 587,
                secure: parseInt(settings.smtp_port) === 465,
                email: settings.mail_from_email,
                password: settings.smtp_password
            };
            await api.settings.update('smtp_config', smtpConfig);
            setMessage({ type: 'success', text: 'SMTP settings saved successfully.' });
        } catch (error) {
            console.error('Error saving SMTP settings:', error);
            setMessage({ type: 'error', text: 'Failed to save SMTP settings.' });
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
            bank_details: [...prev.bank_details, { bank: '', ac_name: '', ac_no: '', routing: '', logo: '' }]
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

    const addSignatory = () => {
        setSettings(prev => ({
            ...prev,
            signatories: [...prev.signatories, { name: '', designation: '', phone: '', email: '' }]
        }));
    };

    const removeSignatory = (index) => {
        setSettings(prev => ({
            ...prev,
            signatories: prev.signatories.filter((_, i) => i !== index)
        }));
    };

    const handleSignatoryChange = (index, field, value) => {
        const newSignatories = [...settings.signatories];
        newSignatories[index] = { ...newSignatories[index], [field]: value };
        setSettings(prev => ({ ...prev, signatories: newSignatories }));
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

            {/* General Configuration */}
            <section className="bg-white p-6 rounded-[28px] shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-slate-800">General Configuration</h2>
                    <button
                        onClick={() => {
                            handleSave('menu_icon', settings.menu_icon);
                            handleSave('company_logo', settings.company_logo);
                        }}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-[#0f0f10] text-white rounded-full text-xs font-semibold disabled:opacity-50"
                    >
                        <Save size={18} /> Save
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Menu Icon (Dashboard)</label>
                        <input 
                            type="text" 
                            value={settings.menu_icon}
                            onChange={(e) => setSettings(prev => ({ ...prev, menu_icon: e.target.value }))}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
                            placeholder="https://..."
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Company Logo</label>
                        <input type="file" accept="image/*" onChange={(e) => handleAssetUpload('company_logo', e.target.files?.[0])} />
                        {settings.company_logo && <img src={settings.company_logo} alt="Company Logo" className="h-16 object-contain" />}
                    </div>
                </div>
            </section>

            {/* Mail Configuration */}
            <section className="bg-white p-6 rounded-[28px] shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-slate-800">Mail Configuration (Microsoft 365 / SMTP)</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handleTestSMTP}
                            disabled={testingSmtp || saving}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-xs font-semibold disabled:opacity-50 hover:bg-blue-700"
                        >
                            {testingSmtp ? 'Testing...' : 'Test Connection'}
                        </button>
                        <button
                            onClick={handleSaveSMTPConfig}
                            disabled={saving || testingSmtp}
                            className="flex items-center gap-2 px-4 py-2 bg-[#0f0f10] text-white rounded-full text-xs font-semibold disabled:opacity-50"
                        >
                            <Save size={18} /> Save config
                        </button>
                    </div>
                </div>

                {message && (
                    <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
                        <input
                            type="text"
                            value={settings.mail_from_name}
                            onChange={(e) => setSettings(prev => ({ ...prev, mail_from_name: e.target.value }))}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
                            placeholder="e.g., ANEX Support"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">From Email <span className="text-red-500">*</span></label>
                        <input
                            type="email"
                            value={settings.mail_from_email}
                            onChange={(e) => setSettings(prev => ({ ...prev, mail_from_email: e.target.value }))}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
                            placeholder="your-email@microsoft365.com"
                        />
                    </div>
                    
                    <div className="md:col-span-2 pt-4 border-t">
                        <h3 className="font-semibold text-slate-800 mb-4">SMTP Configuration</h3>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={settings.smtp_host}
                            onChange={(e) => setSettings(prev => ({ ...prev, smtp_host: e.target.value }))}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
                            placeholder="smtp.office365.com"
                        />
                        <p className="text-xs text-gray-500 mt-1">For Microsoft 365, use: smtp.office365.com</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={settings.smtp_port}
                            onChange={(e) => setSettings(prev => ({ ...prev, smtp_port: e.target.value }))}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
                            placeholder="587"
                        />
                        <p className="text-xs text-gray-500 mt-1">Use 587 for TLS or 465 for SSL</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Username <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={settings.smtp_user}
                            onChange={(e) => setSettings(prev => ({ ...prev, smtp_user: e.target.value }))}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
                            placeholder="your-email@microsoft365.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Password <span className="text-red-500">*</span></label>
                        <input
                            type="password"
                            value={settings.smtp_password}
                            onChange={(e) => setSettings(prev => ({ ...prev, smtp_password: e.target.value }))}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
                            placeholder="••••••••"
                        />
                        <p className="text-xs text-gray-500 mt-1">Use app password for Microsoft 365 accounts with 2FA</p>
                    </div>
                </div>
            </section>

            {/* Company Information */}
            <section className="bg-white p-6 rounded-[28px] shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-slate-800">Company Information</h2>
                    <button
                        onClick={() => handleSave('company_details', settings.company_details)}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-[#0f0f10] text-white rounded-full text-xs font-semibold disabled:opacity-50"
                    >
                        <Save size={18} /> Save
                    </button>
                </div>
                <div className="grid grid-cols-1 gap-6">
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">BIN Number</label>
                        <input
                            type="text"
                            name="bin"
                            value={settings.company_details.bin}
                            onChange={handleCompanyChange}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
                        />
                    </div>
                    <div>
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

            {/* Bank Accounts */}
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
                                        value={bank.bank || ''}
                                        onChange={(e) => handleBankChange(index, 'bank', e.target.value)}
                                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">A/C Name</label>
                                    <input
                                        type="text"
                                        value={bank.ac_name || ''}
                                        onChange={(e) => handleBankChange(index, 'ac_name', e.target.value)}
                                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">A/C Number</label>
                                    <input
                                        type="text"
                                        value={bank.ac_no || ''}
                                        onChange={(e) => handleBankChange(index, 'ac_no', e.target.value)}
                                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Branch / Routing</label>
                                    <input
                                        type="text"
                                        value={bank.routing || ''}
                                        onChange={(e) => handleBankChange(index, 'routing', e.target.value)}
                                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-sm"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Logo</label>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={async (e) => {
                                            if (e.target.files?.[0]) {
                                                const base64 = await fileToBase64(e.target.files[0]);
                                                handleBankChange(index, 'logo', base64);
                                            }
                                        }}
                                        className="text-sm"
                                    />
                                    {bank.logo && <img src={bank.logo} alt="Bank Logo" className="h-12 mt-2 object-contain" />}
                                </div>
                            </div>
                        </div>
                    ))}
                    {settings.bank_details.length === 0 && (
                        <p className="text-gray-400 text-center py-4">No bank accounts added yet.</p>
                    )}
                </div>
            </section>

            {/* Quotation Branding */}
            <section className="bg-white p-6 rounded-[28px] shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-slate-800">Quotation Branding</h2>
                    <button
                        onClick={() => {
                            handleSave('quotation_header', settings.quotation_header);
                            handleSave('quotation_footer', settings.quotation_footer);
                            handleSave('rubber_stamp', settings.rubber_stamp);
                        }}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-[#0f0f10] text-white rounded-full text-xs font-semibold disabled:opacity-50"
                    >
                        <Save size={18} /> Save
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Header Image</label>
                        <input type="file" accept="image/*" onChange={(e) => handleAssetUpload('quotation_header', e.target.files?.[0])} />
                        {settings.quotation_header && <img src={settings.quotation_header} alt="Header" className="h-20 w-full object-contain border" />}
                    </div>
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Footer Image</label>
                        <input type="file" accept="image/*" onChange={(e) => handleAssetUpload('quotation_footer', e.target.files?.[0])} />
                        {settings.quotation_footer && <img src={settings.quotation_footer} alt="Footer" className="h-20 w-full object-contain border" />}
                    </div>
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Rubber Stamp</label>
                        <input type="file" accept="image/*" onChange={(e) => handleAssetUpload('rubber_stamp', e.target.files?.[0])} />
                        {settings.rubber_stamp && <img src={settings.rubber_stamp} alt="Stamp" className="h-20 w-full object-contain" />}
                    </div>
                </div>
            </section>

            {/* Contacts & Terms */}
            <section className="bg-white p-6 rounded-[28px] shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Contacts & Terms</h2>
                    
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-slate-700">Signatories / Contacts</h3>
                            <button
                                onClick={addSignatory}
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold"
                            >
                                <Plus size={16} /> Add Contact
                            </button>
                        </div>
                        <div className="space-y-3">
                            {settings.signatories.map((sig, index) => (
                                <div key={index} className="grid grid-cols-4 gap-3 p-3 bg-[#fbf9f7] rounded-xl relative group">
                                    <button
                                        onClick={() => removeSignatory(index)}
                                        className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <input
                                        type="text"
                                        placeholder="Name"
                                        value={sig.name}
                                        onChange={(e) => handleSignatoryChange(index, 'name', e.target.value)}
                                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Designation"
                                        value={sig.designation}
                                        onChange={(e) => handleSignatoryChange(index, 'designation', e.target.value)}
                                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Phone"
                                        value={sig.phone}
                                        onChange={(e) => handleSignatoryChange(index, 'phone', e.target.value)}
                                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={sig.email}
                                        onChange={(e) => handleSignatoryChange(index, 'email', e.target.value)}
                                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">Quotation Disclaimer</label>
                                <button
                                    onClick={() => handleSave('quotation_disclaimer', settings.quotation_disclaimer)}
                                    disabled={saving}
                                    className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                                >
                                    Save
                                </button>
                            </div>
                            <textarea
                                value={settings.quotation_disclaimer}
                                onChange={(e) => setSettings(prev => ({ ...prev, quotation_disclaimer: e.target.value }))}
                                rows="4"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none text-sm"
                                placeholder="This quotation is generated by ANEX Quotation Engine. Doesn't require a signature to validate."
                            ></textarea>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">Invoice Disclaimer</label>
                                <button
                                    onClick={() => handleSave('invoice_disclaimer', settings.invoice_disclaimer)}
                                    disabled={saving}
                                    className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                                >
                                    Save
                                </button>
                            </div>
                            <textarea
                                value={settings.invoice_disclaimer}
                                onChange={(e) => setSettings(prev => ({ ...prev, invoice_disclaimer: e.target.value }))}
                                rows="4"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none text-sm"
                                placeholder="This invoice is generated by ANEX Invoice Engine. Doesn't require a signature to validate."
                            ></textarea>
                        </div>
                    </div>

                    <div className="mt-4">
                        <button
                            onClick={() => handleSave('signatories', settings.signatories)}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-[#0f0f10] text-white rounded-full text-xs font-semibold disabled:opacity-50"
                        >
                            <Save size={18} /> Save Contacts
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Settings;
