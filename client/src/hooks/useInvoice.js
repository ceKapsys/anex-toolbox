import { useState, useEffect } from 'react';
import api from '../lib/api';
import { numberToWords } from '../utils/numberToWords';

// Get current date/time in Dhaka timezone
const getDhakaDateTime = () => {
    const now = new Date();
    const dhaka = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Dhaka',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(now);

    const time = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    }).format(now);

    return { date: dhaka, time };
};

// Generate invoice number with service shortcode
const generateInvoiceNo = (service) => {
    const shortcode = service?.shortcode || 'GEN';
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 100)).padStart(2, '0');
    return `INV-${shortcode}-${month}${day}${random}`;
};

// Bangladesh Government Holidays for 2026 (update yearly)
const bangladeshHolidays2026 = [
    '2026-02-21', // International Mother Language Day
    '2026-03-17', // Birthday of Sheikh Mujibur Rahman
    '2026-03-26', // Independence Day
    '2026-04-14', // Pahela Baishakh (Bengali New Year)
    '2026-05-01', // May Day
    '2026-07-28', // Eid ul-Adha (approximate)
    '2026-07-29', // Eid ul-Adha (approximate)
    '2026-07-30', // Eid ul-Adha (approximate)
    '2026-08-15', // National Mourning Day
    '2026-12-16', // Victory Day
    '2026-12-25', // Christmas Day
];

// Calculate due date - 7 working days (excluding Fri, Sat, and holidays)
const calculateDueDate = (issueDate) => {
    const date = new Date(issueDate);
    let workingDaysAdded = 0;

    while (workingDaysAdded < 7) {
        date.setDate(date.getDate() + 1);

        const dayOfWeek = date.getDay();
        const dateString = date.toISOString().split('T')[0];

        // Skip Friday (5) and Saturday (6) - Bangladesh weekend
        // Skip government holidays
        if (dayOfWeek !== 5 && dayOfWeek !== 6 && !bangladeshHolidays2026.includes(dateString)) {
            workingDaysAdded++;
        }
    }

    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Dhaka',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
};

export const useInvoice = () => {
    const [saving, setSaving] = useState(false);
    const [clients, setClients] = useState([]);
    const [services, setServices] = useState([]);
    const [terms, setTerms] = useState([]);
    const [banks, setBanks] = useState([]);

    const { date: dhakDate, time: dhakaTime } = getDhakaDateTime();

    const [data, setData] = useState({
        invoice_no: 'INV-' + new Date().getFullYear() + '-001',
        service_id: null,
        issue_date: dhakDate,
        due_date: calculateDueDate(dhakDate),
        time_f: dhakaTime,
        client_id: null,
        client: { name: '', bin: '', address: '' },
        items: [
            { desc: '', unit: '', qty: 1, price: 0, sd: 0, vat: 5, base_total: 0, sd_amount: 0, vat_amount: 0, line_total: 0 }
        ],
        total_qty: 1,
        total_ex_vat: 0,
        total_sd: 0,
        total_vat: 0,
        due_amount: 0,
        adjust_amount: 0,
        adjust_note: '',
        amount_in_words: '',
        company_details: { name: 'ANEX Business Solutions', bin: '123456789', address: 'Dhaka, Bangladesh' },
        company_logo: '',
        bank_details: { bank: '', ac_name: '', ac_no: '', routing: '', logo: '' },
        selected_bank_id: null,
        terms_id: null,
        terms_text: '',
        disclaimer: 'This is a system generated invoice.',
        cogs: 0,
        amount_paid: 0,
        vds: 0,
        tds: 0,
        payment_date: null,
        work_order_ref: ''
    });

    // Load initial data
    useEffect(() => {
        const load = async () => {
            try {
                // Services
                const servRes = await api.get('/services');
                setServices(Array.isArray(servRes) ? servRes : []);

                // Terms
                const termsRes = await api.get('/terms');
                setTerms(Array.isArray(termsRes) ? termsRes : []);

                // Clients
                const clientsRes = await api.get('/clients');
                setClients(Array.isArray(clientsRes) ? clientsRes : []);

                // Settings
                const settingsRes = await api.get('/settings');
                const s = settingsRes || {};

                const bankDetailsArray = typeof s.bank_details === 'string'
                    ? JSON.parse(s.bank_details || '[]')
                    : (Array.isArray(s.bank_details) ? s.bank_details : []);

                setBanks(bankDetailsArray);

                // Set initial data from settings
                setData(prev => ({
                    ...prev,
                    company_details: typeof s.company_details === 'string'
                        ? JSON.parse(s.company_details)
                        : (s.company_details || prev.company_details),
                    company_logo: s.company_logo || prev.company_logo,
                    bank_details: bankDetailsArray.length > 0
                        ? { ...prev.bank_details, ...bankDetailsArray[0], logo: s.bank_logo || bankDetailsArray[0]?.logo }
                        : prev.bank_details,
                    selected_bank_id: 0,
                    disclaimer: s.invoice_disclaimer || prev.disclaimer
                }));
            } catch (err) {
                console.error("Error loading resources:", err);
            }
        };
        load();
    }, []);

    // Update invoice number when service changes
    useEffect(() => {
        if (data.service_id) {
            const service = services.find(s => s.id === data.service_id);
            if (service) {
                setData(prev => ({
                    ...prev,
                    invoice_no: generateInvoiceNo(service)
                }));
            }
        }
    }, [data.service_id, services]);

    // Update terms when terms_id changes
    useEffect(() => {
        if (data.terms_id) {
            const term = terms.find(t => t.id === data.terms_id);
            if (term) {
                setData(prev => ({
                    ...prev,
                    terms_text: term.description
                }));
            }
        }
    }, [data.terms_id, terms]);

    // Update bank details when selected bank changes
    useEffect(() => {
        if (data.selected_bank_id !== null && banks.length > 0) {
            const bank = banks[data.selected_bank_id];
            if (bank) {
                setData(prev => ({
                    ...prev,
                    bank_details: { ...prev.bank_details, ...bank }
                }));
            }
        }
    }, [data.selected_bank_id, banks]);

    // Recalculate due_date when issue_date changes
    useEffect(() => {
        if (data.issue_date) {
            const newDueDate = calculateDueDate(data.issue_date);
            setData(prev => ({
                ...prev,
                due_date: newDueDate
            }));
        }
    }, [data.issue_date]);

    // Calculation Effect
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

            t_qty += qty; t_base += base; t_sd += sd; t_vat += vat; t_gross += total;

            return { ...item, base_total: base, sd_amount: sd, vat_amount: vat, line_total: total };
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
            amount_in_words: numberToWords(due),
            totals_data: {
                total_qty: t_qty,
                total_ex_vat: t_base,
                total_sd: t_sd,
                total_vat: t_vat,
                due_amount: due
            }
        }));
    }, [JSON.stringify(data.items.map(i => [i.qty, i.price, i.sd, i.vat])), data.adjust_amount]);

    // Handlers
    const updateField = (field, value) => setData(prev => ({ ...prev, [field]: value }));

    const updateClient = (clientId) => {
        const client = clients.find(c => c.id === parseInt(clientId));
        if (client) {
            setData(prev => ({
                ...prev,
                client_id: client.id,
                client: {
                    name: client.name || client.company || '',
                    bin: client.bin || '',
                    address: client.address || ''
                },
                client_snapshot: client
            }));
        }
    };

    const updateItem = (index, field, value) => {
        const newItems = [...data.items];
        newItems[index][field] = value;
        setData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => setData(prev => ({
        ...prev,
        items: [...prev.items, { desc: '', unit: 'Month', qty: 1, price: 0, sd: 0, vat: 5, base_total: 0, sd_amount: 0, vat_amount: 0, line_total: 0 }]
    }));

    const removeItem = (index) => setData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));

    const saveInvoice = async () => {
        setSaving(true);
        try {
            const payload = {
                ...data,
                items_data: data.items,
                client_snapshot: data.client,
                bank_snapshot: data.bank_details,
                totals_data: {
                    total_qty: data.total_qty,
                    total_ex_vat: data.total_ex_vat,
                    total_sd: data.total_sd,
                    total_vat: data.total_vat,
                    grand_total: data.due_amount + (Number(data.adjust_amount) || 0),
                    due_amount: data.due_amount,
                    ait_amount: 0
                },
                status: 'Draft',
                cogs: data.cogs || 0,
                amount_paid: data.amount_paid || 0,
                vds: data.vds || 0,
                tds: data.tds || 0,
                payment_date: data.payment_date || null
            };

            const response = await api.post('/invoices', payload);
            alert('Invoice saved successfully!');
            return response.data;
        } catch (err) {
            console.error(err);
            alert('Failed to save invoice.');
            return null;
        } finally {
            setSaving(false);
        }
    };

    return {
        data,
        clients,
        services,
        terms,
        banks,
        saving,
        updateField,
        updateClient,
        updateItem,
        addItem,
        removeItem,
        saveInvoice,
        setData
    };
};
