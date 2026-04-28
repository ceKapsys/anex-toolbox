import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Bell,
    Search,
    ChevronDown,
    MoreHorizontal,
    ArrowUpRight,
    Wallet,
    ArrowUp,
    ArrowDown,
    FileText,
    Receipt,
    UserPlus,
    Plus
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';

import api from '../lib/api';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalInvoices: 0,
        totalReceivables: 0,
        totalReceived: 0,
        paymentPending: 0,
        deductedVAT: 0,
        deductedAIT: 0
    });

    const [monthlyQuotationData, setMonthlyQuotationData] = useState([]);

    // Quick Action Card Data
    const [lastQuotation, setLastQuotation] = useState(null);
    const [lastInvoice, setLastInvoice] = useState(null);
    const [lastClient, setLastClient] = useState(null);

    const balanceData = [
        { name: 'Mon', value: 4000 },
        { name: 'Tue', value: 3000 },
        { name: 'Wed', value: 5000 },
        { name: 'Thu', value: 2780 },
        { name: 'Fri', value: 1890 },
        { name: 'Sat', value: 2390 },
        { name: 'Sun', value: 3490 },
    ];

    const processQuotationData = (data) => {
        const monthlyGroups = {};

        data.forEach(q => {
            const date = new Date(q.date);
            const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });

            if (!monthlyGroups[monthKey]) {
                monthlyGroups[monthKey] = { name: monthKey, passed: 0, rejected: 0 };
            }
            if (q.status === 'Passed') monthlyGroups[monthKey].passed += 1;
            if (q.status === 'Rejected') monthlyGroups[monthKey].rejected += 1;
        });

        setMonthlyQuotationData(Object.values(monthlyGroups));
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch Invoices
                const invoicesResponse = await api.get('/invoices');
                const invoices = Array.isArray(invoicesResponse) ? invoicesResponse : [];

                const totalReceivables = invoices.reduce((sum, inv) => {
                    const val = inv.totals_data?.due_amount || 0;
                    return sum + (typeof val === 'number' ? val : 0);
                }, 0);

                const totalReceived = invoices.reduce((sum, inv) => {
                    const val = inv.amount_paid || 0;
                    return sum + (typeof val === 'number' ? val : 0);
                }, 0);

                const newStats = {
                    totalInvoices: invoices.length,
                    totalReceivables: totalReceivables,
                    totalReceived: totalReceived,
                    paymentPending: totalReceivables - totalReceived,
                    deductedVAT: invoices.reduce((sum, inv) => {
                        const val = inv.vds || 0;
                        return sum + (typeof val === 'number' ? val : 0);
                    }, 0),
                    deductedAIT: invoices.reduce((sum, inv) => {
                        const val = inv.tds || 0;
                        return sum + (typeof val === 'number' ? val : 0);
                    }, 0)
                };
                setStats(newStats);

                // Set last invoice
                if (invoices.length > 0) {
                    const sorted = [...invoices].sort((a, b) => {
                        const dateA = new Date(a.issue_date || a.created_at);
                        const dateB = new Date(b.issue_date || b.created_at);
                        return dateB - dateA;
                    });
                    setLastInvoice(sorted[0]);
                }

                // Fetch Quotations
                const quotationsResponse = await api.quotations.list();
                const quotations = Array.isArray(quotationsResponse) ? quotationsResponse : [];
                processQuotationData(quotations);

                // Set last quotation
                if (quotations.length > 0) {
                    const sorted = [...quotations].sort((a, b) => {
                        const dateA = new Date(a.date || a.created_at);
                        const dateB = new Date(b.date || b.created_at);
                        return dateB - dateA;
                    });
                    setLastQuotation(sorted[0]);
                }

                // Fetch Clients
                const clientsResponse = await api.get('/clients');
                const clients = Array.isArray(clientsResponse) ? clientsResponse : [];

                if (clients.length > 0) {
                    const sortedClients = [...clients].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
                    const latestClient = sortedClients[0];

                    // Count quotations and invoices for this client
                    const clientQuotations = quotations.filter(q => q.client_id === latestClient.id || q.to_company === latestClient.name);
                    const clientInvoices = invoices.filter(inv => inv.client_id === latestClient.id || inv.bill_to === latestClient.name);
                    const totalInvoiceAmount = clientInvoices.reduce((sum, inv) => sum + (Number(inv.totals_data?.grand_total) || 0), 0);

                    setLastClient({
                        ...latestClient,
                        quotationCount: clientQuotations.length,
                        invoiceTotal: totalInvoiceAmount
                    });
                }

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            }
        };

        fetchDashboardData();
    }, []);

    const formatCurrency = (amount) => {
        return `Tk ${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="min-h-full px-10 py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search for anything..."
                        className="w-full rounded-full bg-white px-12 py-3 text-sm text-slate-600 shadow-[0_10px_30px_rgba(15,23,42,0.08)] focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <button className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-400 shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:text-slate-600 transition">
                        <Bell className="w-6 h-6" />
                        <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                    <div className="flex items-center gap-3 rounded-full bg-white px-3 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-xs">AB</div>
                        <div className="hidden md:block">
                            <p className="text-sm font-semibold text-slate-800">Admin User</p>
                            <p className="text-xs text-slate-400">Super Admin</p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                    </div>
                </div>
            </div>

            {/* Quick Action Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Last Quotation Card */}
                <div className="bg-[#ff6b35] text-white p-6 rounded-[28px] border border-red-500 shadow-[0_18px_40px_rgba(255,107,53,0.35)]">
                    <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-5 h-5" />
                        <span className="text-sm font-medium text-white/80">Last Quotation</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-1 truncate">{lastQuotation?.to_company || 'No quotations yet'}</h3>
                    <p className="text-white/80 text-sm mb-4">
                        Quoted Amount: <span className="font-semibold text-white">{formatCurrency(lastQuotation?.total)}</span>
                    </p>
                    <Link to="/quotations/new" className="w-full py-3 bg-white text-[#ff6b35] font-semibold rounded-2xl shadow-lg hover:bg-orange-50 transition flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" /> Create New Quotation
                    </Link>
                </div>

                {/* Last Invoice Card */}
                <div className="bg-[#3b82f6] text-white p-6 rounded-[28px] border border-red-500 shadow-[0_18px_40px_rgba(59,130,246,0.35)]">
                    <div className="flex items-center gap-2 mb-3">
                        <Receipt className="w-5 h-5" />
                        <span className="text-sm font-medium text-white/80">Last Invoice</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-1 truncate">
                        {lastInvoice?.client_snapshot?.name || lastInvoice?.client_snapshot?.company || lastInvoice?.invoice_no || 'No invoices yet'}
                    </h3>
                    <p className="text-white/80 text-sm mb-4">
                        Invoice Amount: <span className="font-semibold text-white">{formatCurrency(lastInvoice?.totals_data?.due_amount)}</span>
                    </p>
                    <Link to="/invoices/new" className="w-full py-3 bg-white text-[#3b82f6] font-semibold rounded-2xl shadow-lg hover:bg-blue-50 transition flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" /> Create New Invoice
                    </Link>
                </div>

                {/* Last Client Card */}
                <div className="bg-[#10b981] text-white p-6 rounded-[28px] border border-red-500 shadow-[0_18px_40px_rgba(16,185,129,0.35)]">
                    <div className="flex items-center gap-2 mb-3">
                        <UserPlus className="w-5 h-5" />
                        <span className="text-sm font-medium text-white/80">Last Client</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-1 truncate">{lastClient?.name || 'No clients yet'}</h3>
                    <p className="text-white/80 text-sm mb-4">
                        Quotations: <span className="font-semibold text-white">{lastClient?.quotationCount || 0}</span> • Invoices: <span className="font-semibold text-white">{formatCurrency(lastClient?.invoiceTotal)}</span>
                    </p>
                    <Link to="/clients" className="w-full py-3 bg-white text-[#10b981] font-semibold rounded-2xl shadow-lg hover:bg-emerald-50 transition flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" /> Add New Client
                    </Link>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="space-y-8">
                {/* Top Stats Cards (Invoices) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Receivables Card */}
                    <div
                        className="bg-[#0f0f10] text-white p-6 rounded-[28px] shadow-[0_18px_40px_rgba(15,23,42,0.25)] relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full filter blur-3xl opacity-20 -mr-10 -mt-10"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-2 bg-white/10 rounded-2xl backdrop-blur-md">
                                    <Wallet className="w-6 h-6 text-white" />
                                </div>
                                <MoreHorizontal className="w-5 h-5 text-white/60 cursor-pointer" />
                            </div>
                            <div>
                                <p className="text-white/60 text-sm mb-1">Total Receivables</p>
                                <h2 className="text-3xl font-semibold mb-4">{formatCurrency(stats.totalReceivables)}</h2>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg flex items-center gap-1">
                                        <ArrowUpRight className="w-3 h-3" /> +0.0%
                                    </span>
                                    <span className="text-white/60">vs last month</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Received Card */}
                    <StatCard
                        title="Total Received"
                        displayValue={formatCurrency(stats.totalReceived)}
                        trend="+0.0%"
                        color="green"
                        icon={ArrowUp}
                    />

                    {/* Payment Pending Card */}
                    <StatCard
                        title="Payment Pending"
                        displayValue={formatCurrency(stats.paymentPending)}
                        trend="+0.0%"
                        color="orange"
                        icon={ArrowUp}
                    />
                </div>

                {/* Second Row Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Deducted VAT Card */}
                    <StatCard
                        title="Deducted VAT"
                        displayValue={formatCurrency(stats.deductedVAT)}
                        trend="+0.0%"
                        color="blue"
                        icon={ArrowDown}
                    />

                    {/* Deducted AIT Card */}
                    <StatCard
                        title="Deducted AIT"
                        displayValue={formatCurrency(stats.deductedAIT)}
                        trend="+0.0%"
                        color="purple"
                        icon={ArrowDown}
                    />
                </div>

                {/* Monthly Quotation Performance Chart */}
                <div className="bg-white p-6 rounded-[28px] shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-slate-800">Quotation Performance (Monthly)</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#10b981]"></div> Passed</span>
                            <span className="text-xs text-slate-500 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#ef4444]"></div> Rejected</span>
                        </div>
                    </div>
                    <div className="h-[300px] w-full" style={{ minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={monthlyQuotationData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 12px' }}
                                    itemStyle={{ color: '#fff' }}
                                    cursor={{ fill: '#f8fafc' }}
                                />
                                <Bar dataKey="passed" name="Passed" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="rejected" name="Rejected" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Balance History Chart */}
                <div className="bg-white p-6 rounded-[28px] shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-slate-800">Balance History</h3>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-xs text-slate-500 hover:bg-slate-50 transition">
                            Monthly <ChevronDown className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="h-[300px] w-full" style={{ minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={balanceData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 12px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, displayValue, subValue, trend, color, icon: Icon }) => {
    const colorClasses = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', iconBg: 'bg-blue-100', trendBg: 'bg-blue-100', trendText: 'text-blue-700' },
        green: { bg: 'bg-emerald-50', text: 'text-emerald-600', iconBg: 'bg-emerald-100', trendBg: 'bg-emerald-100', trendText: 'text-emerald-700' },
        red: { bg: 'bg-rose-50', text: 'text-rose-600', iconBg: 'bg-rose-100', trendBg: 'bg-rose-100', trendText: 'text-rose-700' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-600', iconBg: 'bg-orange-100', trendBg: 'bg-orange-100', trendText: 'text-orange-700' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-600', iconBg: 'bg-amber-100', trendBg: 'bg-amber-100', trendText: 'text-amber-700' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-600', iconBg: 'bg-purple-100', trendBg: 'bg-purple-100', trendText: 'text-purple-700' }
    };
    const c = colorClasses[color] || colorClasses.blue;

    return (
        <div className="bg-white p-6 rounded-[28px] border border-red-500 shadow-[0_18px_40px_rgba(15,23,42,0.06)] hover:shadow-[0_24px_50px_rgba(15,23,42,0.08)] transition">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-2xl ${c.iconBg}`}>
                    <Icon className={`w-5 h-5 ${c.text}`} />
                </div>
                <MoreHorizontal className="w-5 h-5 text-slate-300 cursor-pointer" />
            </div>
            <p className="text-slate-500 text-sm mb-1">{title}</p>
            <h3 className="text-2xl font-semibold text-slate-800 mb-1">{displayValue}</h3>
            {subValue && <p className="text-xs text-slate-500 mb-2">{subValue}</p>}

            <div className="flex items-center gap-2 text-sm">
                <span className={`px-2 py-0.5 rounded-md flex items-center gap-1 text-xs font-semibold ${c.trendBg} ${c.trendText}`}>
                    <ArrowUpRight className="w-3 h-3" />
                    {trend}
                </span>
            </div>
        </div>
    );
};

export default Dashboard;
