import React, { useState } from 'react';
import {
    Bell,
    Search,
    ChevronDown,
    MoreHorizontal,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    ArrowUp,
    ArrowDown,
    Filter
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
import { motion } from 'framer-motion';

const Dashboard = () => {
    // Mock Data for Charts
    const balanceData = [
        { name: 'Mon', value: 4000 },
        { name: 'Tue', value: 3000 },
        { name: 'Wed', value: 5000 },
        { name: 'Thu', value: 2780 },
        { name: 'Fri', value: 1890 },
        { name: 'Sat', value: 2390 },
        { name: 'Sun', value: 3490 },
    ];

    const incomeExpenseData = [
        { name: 'Jan', income: 4000, expense: 2400 },
        { name: 'Feb', income: 3000, expense: 1398 },
        { name: 'Mar', income: 2000, expense: 9800 },
        { name: 'Apr', income: 2780, expense: 3908 },
        { name: 'May', income: 1890, expense: 4800 },
        { name: 'Jun', income: 2390, expense: 3800 },
    ];

    const transactions = [
        { id: 1, name: 'Adobe Creative Cloud', category: 'Subscription', date: 'Oct 24, 2023', amount: 120.00, type: 'expense', icon: '🎨' },
        { id: 2, name: 'Web Development', category: 'Freelance', date: 'Oct 23, 2023', amount: 3500.00, type: 'income', icon: '💻' },
        { id: 3, name: 'Spotify Premium', category: 'Entertainment', date: 'Oct 22, 2023', amount: 12.00, type: 'expense', icon: '🎵' },
        { id: 4, name: 'Client Payment', category: 'Design Work', date: 'Oct 21, 2023', amount: 1250.00, type: 'income', icon: '🖌️' },
    ];

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

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column (Stats & Balance) */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Top Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Total Balance Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#0f0f10] text-white p-6 rounded-[28px] shadow-[0_18px_40px_rgba(15,23,42,0.25)] relative overflow-hidden"
                        >
                            {/* Decorative gradient blob */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full filter blur-3xl opacity-20 -mr-10 -mt-10"></div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-2 bg-white/10 rounded-2xl backdrop-blur-md">
                                        <Wallet className="w-6 h-6 text-white" />
                                    </div>
                                    <MoreHorizontal className="w-5 h-5 text-white/60 cursor-pointer" />
                                </div>
                                <div>
                                    <p className="text-white/60 text-sm mb-1">Total Balance</p>
                                    <h2 className="text-3xl font-semibold mb-4">$12,450.00</h2>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg flex items-center gap-1">
                                            <ArrowUpRight className="w-3 h-3" /> +12.5%
                                        </span>
                                        <span className="text-white/60">vs last month</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Income Card */}
                        <StatCard
                            title="Total Income"
                            amount="$5,240.00"
                            trend="+4.2%"
                            color="green"
                            icon={ArrowUp}
                        />

                        {/* Expense Card */}
                        <StatCard
                            title="Total Expense"
                            amount="$2,420.00"
                            trend="-1.8%"
                            color="red"
                            icon={ArrowDown}
                        />
                    </div>

                    {/* Balance History Chart */}
                    <div className="bg-white p-6 rounded-[28px] shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-slate-800">Balance History</h3>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-xs text-slate-500 hover:bg-slate-50 transition">
                                Monthly <ChevronDown className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
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

                {/* Right Column (Transactions & Quick Actions) */}
                <div className="space-y-8">

                    {/* Quick Transfer / Features (Placeholder for now, maybe use for something else) */}
                    <div className="bg-[#ff6b35] text-white p-6 rounded-[28px] shadow-[0_18px_40px_rgba(255,107,53,0.35)]">
                        <h3 className="text-xl font-semibold mb-2">Upgrade to Pro</h3>
                        <p className="text-white/80 text-sm mb-4">Unlock advanced features and unlimited invoices.</p>
                        <button className="w-full py-3 bg-white text-[#ff6b35] font-semibold rounded-2xl shadow-lg hover:bg-orange-50 transition">
                            Upgrade Now
                        </button>
                    </div>

                    {/* Recent Transactions */}
                    <div className="bg-white p-6 rounded-[28px] shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-slate-800">Transactions</h3>
                            <div className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                                <Filter className="w-5 h-5 text-slate-400" />
                            </div>
                        </div>
                        <div className="space-y-6">
                            {transactions.map(tx => (
                                <div key={tx.id} className="flex items-center justify-between group cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-xl group-hover:bg-slate-100 transition">
                                            {tx.icon}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800 group-hover:text-slate-900 transition">{tx.name}</p>
                                            <p className="text-xs text-slate-400">{tx.category} • {tx.date}</p>
                                        </div>
                                    </div>
                                    <div className={`text-right font-semibold ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                                        {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-6 py-3 border border-slate-200 text-slate-500 font-medium rounded-2xl hover:bg-slate-50 transition text-sm">
                            View All Transactions
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, amount, trend, color, icon: Icon }) => {
    const isPositive = color === 'green';
    return (
        <div className="bg-white p-6 rounded-[28px] shadow-[0_18px_40px_rgba(15,23,42,0.06)] hover:shadow-[0_24px_50px_rgba(15,23,42,0.08)] transition">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-2xl ${isPositive ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                    <Icon className={`w-5 h-5 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`} />
                </div>
                <MoreHorizontal className="w-5 h-5 text-slate-300 cursor-pointer" />
            </div>
            <p className="text-slate-500 text-sm mb-1">{title}</p>
            <h3 className="text-2xl font-semibold text-slate-800 mb-2">{amount}</h3>
            <div className="flex items-center gap-2 text-sm">
                <span className={`px-2 py-0.5 rounded-md flex items-center gap-1 text-xs font-semibold ${isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {trend}
                </span>
                <span className="text-slate-400 text-xs">vs last month</span>
            </div>
        </div>
    );
};

export default Dashboard;
