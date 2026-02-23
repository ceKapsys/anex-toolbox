import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Download, Eye, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import QuotationTemplate from '../components/templates/QuotationTemplate';
import { generatePDF } from '../utils/pdfGenerator';
import clsx from 'clsx';
import api from '../lib/api';

const QuotationGenerator = () => {
    const templateRef = useRef();
    const pdfRef = useRef();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const quotationId = searchParams.get('id');
    const [activeTab, setActiveTab] = useState('edit'); // edit | preview
    const [saving, setSaving] = useState(false);
    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [quotationTerms, setQuotationTerms] = useState([]);
    const [signatories, setSignatories] = useState([]);
    const [serviceType, setServiceType] = useState('GEN');
    const [services, setServices] = useState([]);
    const [quotations, setQuotations] = useState([]);

    // Generate random 4-character alphanumeric code
    const generateRandomCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    // Initial State
    const [data, setData] = useState({
        quotation_number: 'AQB-GEN-' + (new Date().getMonth() + 1) + '-' + generateRandomCode(),
        quotation_date: new Date().toISOString().split('T')[0],
        valid_till_date: '', // Will be calc
        client: {
            name: '',
            address: '',
            attention: ''
        },
        items: [
            { title: '', description: '', qty: 1, unit: '', price: 0, line_total: 0 }
        ],
        vat_percentage: 15,
        subtotal: 0,
        vat_amount: 0,
        grand_total: 0,
        terms_conditions: '',
        contact_details: {
            name: '',
            designation: '',
            phone: '',
            email: ''
        },
        header_image: '',
        footer_image: '',
        disclaimer: ''
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
                const sigs = Array.isArray(s.signatories) ? s.signatories : [];
                setSignatories(sigs);

                setData(prev => ({
                    ...prev,
                    header_image: s.quotation_header || prev.header_image,
                    footer_image: s.quotation_footer || prev.footer_image,
                    // terms_conditions: s.terms_quote || prev.terms_conditions, // Don't overwrite if manual? actually requirements say terms come from quotation terms so start empty or default
                    disclaimer: s.quotation_disclaimer || prev.disclaimer,
                    contact_details: sigs.length > 0 ? sigs[0] : prev.contact_details
                }));
            } catch (err) {
                console.error(err);
            }
        };
        const loadTerms = async () => {
            try {
                const termsRes = await api.get('/quotation-terms');
                setQuotationTerms(Array.isArray(termsRes) ? termsRes : []);
            } catch (err) {
                console.error(err);
            }
        };
        const loadServices = async () => {
            try {
                const res = await api.services.list();
                setServices(Array.isArray(res) ? res : []);
            } catch (err) { console.error(err); }
        };
        const loadQuotations = async () => {
            try {
                const res = await api.quotations.list();
                setQuotations(Array.isArray(res) ? res : []);
            } catch (err) { console.error(err); }
        };
        const loadQuotationById = async (id) => {
            try {
                const quotation = await api.quotations.get(id);
                if (quotation) {
                    // Populate form with existing quotation data
                    const clientId = quotation.client_id || quotation.id;
                    setSelectedClientId(clientId);
                    
                    setData({
                        quotation_number: quotation.quotation_number || '',
                        quotation_date: quotation.date || new Date().toISOString().split('T')[0],
                        valid_till_date: quotation.valid_till_date || '',
                        client: {
                            name: quotation.to_company || '',
                            address: quotation.to_address || '',
                            attention: quotation.attn || ''
                        },
                        items: quotation.items || [{ title: '', description: '', qty: 1, unit: 'Pcs', price: 0, line_total: 0 }],
                        vat_percentage: quotation.vat || 15,
                        subtotal: 0,
                        vat_amount: 0,
                        grand_total: quotation.total || 0,
                        terms_conditions: quotation.terms || '',
                        contact_details: {
                            name: quotation.contact_name || '',
                            designation: '',
                            phone: '',
                            email: ''
                        },
                        header_image: '',
                        footer_image: '',
                        disclaimer: ''
                    });
                }
            } catch (err) {
                console.error('Error loading quotation:', err);
            }
        };

        loadClients();
        loadSettings();
        loadTerms();
        loadServices();
        loadQuotations();
        
        // Load existing quotation if ID is provided
        if (quotationId) {
            loadQuotationById(quotationId);
        }
    }, [quotationId]);

    // Set initial service type when services load
    useEffect(() => {
        if (services.length > 0 && serviceType === 'GEN') {
            const firstServiceCode = services[0].shortcode || services[0].name.substring(0, 3).toUpperCase();
            setServiceType(firstServiceCode);
        }
    }, [services]);

    // ... (calculations effect remains same)

    const handleSignatoryChange = (e) => {
        const index = e.target.value;
        if (index !== "" && signatories[index]) {
            setData(prev => ({ ...prev, contact_details: signatories[index] }));
        }
    };

    // ... (rest of handlers)

    // ... (inside render, replace Contact Details inputs with select)


    // Calculate totals when items change
    // Auto-calculate Validity Date and Quotation Number
    useEffect(() => {
        if (!data.quotation_date) return;

        const date = new Date(data.quotation_date);

        // Validity +30 days
        const validDate = new Date(date);
        validDate.setDate(date.getDate() + 30);
        const validTill = validDate.toISOString().split('T')[0];

        // Generate Number Logic: AQB-{ServiceCode}-{Month}-{3-digit alphanumeric}
        const month = date.getMonth() + 1;
        const randomCode = generateRandomCode();
        const number = `AQB-${serviceType}-${month}-${randomCode}`;

        setData(prev => ({
            ...prev,
            valid_till_date: validTill,
            quotation_number: number
        }));

    }, [data.quotation_date, serviceType]);

    // Calculate totals when items change
    useEffect(() => {
        const subtotal = data.items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.price)), 0);
        const vat = subtotal * (Number(data.vat_percentage) / 100);
        const total = subtotal + vat;

        const updatedItems = data.items.map(item => ({
            ...item,
            line_total: Number(item.qty) * Number(item.price)
        }));

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

    const [generating, setGenerating] = useState(false);

    const downloadPDF = async () => {
        setGenerating(true);
        try {
            await generatePDF(pdfRef.current, `${data.quotation_number}.pdf`);
        } catch (err) {
            console.error('PDF generation failed:', err);
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Map to backend schema
            const payload = {
                quotation_number: data.quotation_number,
                client_id: selectedClientId ? Number(selectedClientId) : 0,
                to_company: data.client.name,
                to_address: data.client.address,
                attn: data.client.attention,
                type: 'GEN',
                date: data.quotation_date,
                valid_till_date: data.valid_till_date,
                vat: data.vat_percentage,
                discount: 0,
                items: data.items,
                terms: data.terms_conditions,
                contact_name: data.contact_details.name,
                total: data.grand_total,
                status: 'Draft'
            };

            if (quotationId) {
                // Update existing quotation
                await api.quotations.update(quotationId, payload);
                alert('Quotation updated successfully!');
            } else {
                // Create new quotation
                await api.quotations.create(payload);
                alert('Quotation saved successfully!');
            }
            navigate('/quotations');
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
                    <div className="flex items-center gap-3">
                        <Link to="/quotations" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
                            <ArrowLeft className="w-4 h-4" /> Back to Quotations
                        </Link>
                    </div>
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
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Service Type</label>
                                <select
                                    value={serviceType}
                                    onChange={e => setServiceType(e.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                                >
                                    {services.map((s, idx) => (
                                        <option key={idx} value={s.shortcode || s.name.substring(0, 3).toUpperCase()}>
                                            {s.name} ({s.shortcode || s.name.substring(0, 3).toUpperCase()})
                                        </option>
                                    ))}
                                    {services.length === 0 && <option value="GEN">General (GEN)</option>}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Quote Number</label>
                                <input
                                    type="text"
                                    value={data.quotation_number}
                                    readOnly
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500 focus:outline-none"
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
                        <p className="text-xs text-slate-400 italic px-2">Client details are hidden in editor.</p>
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
                        </div>
                        {/* Grand total hidden */}
                    </div>

                    {/* Footer / Terms */}
                    <div className="space-y-4 pb-10 border-t pt-4">
                        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Footer & Terms</h3>

                        <div className="flex gap-4">
                            <div className="w-1/3 space-y-2 max-h-60 overflow-y-auto pr-2">
                                <p className="text-xs font-semibold text-slate-500 mb-2">Click to insert term:</p>
                                {quotationTerms.map((term) => (
                                    <button
                                        key={term.id}
                                        onClick={() => {
                                            const bullet = `• ${term.description}`;
                                            const newText = data.terms_conditions
                                                ? `${data.terms_conditions}\n${bullet}`
                                                : bullet;
                                            setData({ ...data, terms_conditions: newText });
                                        }}
                                        className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-100 text-xs text-slate-700 transition"
                                    >
                                        {term.name}
                                    </button>
                                ))}
                                {quotationTerms.length === 0 && (
                                    <p className="text-xs text-slate-400 italic">No quotation terms found.</p>
                                )}
                            </div>

                            <div className="w-2/3">
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Terms & Conditions</label>
                                <textarea
                                    value={data.terms_conditions}
                                    onChange={e => setData({ ...data, terms_conditions: e.target.value })}
                                    rows={6}
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Signatory / Contact Person</label>
                            <select
                                onChange={handleSignatoryChange}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                                defaultValue={0}
                            >
                                {signatories.map((sig, idx) => (
                                    <option key={idx} value={idx}>
                                        {sig.name} ({sig.designation})
                                    </option>
                                ))}
                                {signatories.length === 0 && <option value="">No signatories found in settings</option>}
                            </select>
                        </div>

                        {/* Disclaimer and Footer Note hidden */}
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
                        disabled={generating}
                        className="bg-[#0f0f10] hover:bg-black text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition disabled:opacity-60"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" /> Download PDF
                            </>
                        )}
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-8 bg-[#f6f3f1] flex justify-center items-start">
                    {/* Scale down the preview to fit */}
                    <div className="origin-top transform scale-[0.55]" style={{ width: '794px', minWidth: '794px' }}>
                        <QuotationTemplate ref={templateRef} data={data} />
                    </div>
                </div>
            </div >

            <div style={{ position: 'fixed', top: 0, left: '-10000px', visibility: 'hidden', pointerEvents: 'none' }}>
                <QuotationTemplate ref={pdfRef} data={data} />
            </div>
        </div>
    );
};

export default QuotationGenerator;
