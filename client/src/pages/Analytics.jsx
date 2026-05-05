import React, { useEffect, useState, useMemo } from 'react';
import { BarChart3, TrendingUp, Receipt, FileText, CreditCard, Percent, Calendar, Filter, Clock, Users, Briefcase } from 'lucide-react';
import api from '../lib/api';

const Analytics = () => {
    const [invoices, setInvoices] = useState([]);
    const [quotations, setQuotations] = useState([]);
    const [clients, setClients] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [timeFilter, setTimeFilter] = useState('month'); // month, quarter, year
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(new Date().getMonth() / 3) + 1);
    const [selectedClient, setSelectedClient] = useState('all');
    const [selectedService, setSelectedService] = useState('all');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [invoicesRes, quotationsRes, clientsRes, servicesRes] = await Promise.all([
                    api.get('/invoices'),
                    api.quotations.list(),
                    api.clients.list(),
                    api.get('/services')
                ]);
                setInvoices(Array.isArray(invoicesRes) ? invoicesRes : []);
                setQuotations(Array.isArray(quotationsRes) ? quotationsRes : []);
                setClients(Array.isArray(clientsRes) ? clientsRes : []);
                setServices(Array.isArray(servicesRes) ? servicesRes : []);
            } catch (err) {
                console.error('Error loading analytics data:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Helper to check if date is in filter range
    const isInDateRange = (dateStr) => {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = date.getMonth();
        const quarter = Math.floor(month / 3) + 1;

        if (timeFilter === 'month') {
            return year === selectedYear && month === selectedMonth;
        } else if (timeFilter === 'quarter') {
            return year === selectedYear && quarter === selectedQuarter;
        } else if (timeFilter === 'year') {
            return year === selectedYear;
        }
        return false;
    };

    // Filtered data
    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            const dateMatch = isInDateRange(inv.issue_date || inv.created_at);
            const clientMatch = selectedClient === 'all' || inv.client_id === parseInt(selectedClient);
            return dateMatch && clientMatch;
        });
    }, [invoices, timeFilter, selectedMonth, selectedYear, selectedQuarter, selectedClient]);

    const filteredQuotations = useMemo(() => {
        return quotations.filter(q => {
            const dateMatch = isInDateRange(q.date);
            const clientMatch = selectedClient === 'all' ||
                q.client_id === parseInt(selectedClient) ||
                q.to_company === clients.find(c => c.id === parseInt(selectedClient))?.name;
            const serviceMatch = selectedService === 'all' || q.type === selectedService;
            return dateMatch && clientMatch && serviceMatch;
        });
    }, [quotations, timeFilter, selectedMonth, selectedYear, selectedQuarter, selectedClient, selectedService, clients]);

    // Invoice metrics
    const invoiceMetrics = useMemo(() => {
        const paidInvoices = filteredInvoices.filter(i => i.status === 'Paid');

        // On-time payment: paid within 30 days of issue_date
        const onTimePayments = paidInvoices.filter(inv => {
            if (!inv.issue_date || !inv.payment_date) return false;
            const issueDate = new Date(inv.issue_date);
            const paymentDate = new Date(inv.payment_date);
            const diffDays = (paymentDate - issueDate) / (1000 * 60 * 60 * 24);
            return diffDays <= 30;
        });

        return {
            total: filteredInvoices.length,
            totalAmount: filteredInvoices.reduce((sum, inv) => sum + (inv.totals_data?.due_amount || 0), 0),
            paid: paidInvoices.length,
            paidAmount: paidInvoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0),
            pending: filteredInvoices.filter(i => i.status === 'Submitted').length,
            pendingAmount: filteredInvoices.reduce((sum, inv) => {
                if (inv.status === 'Submitted') return sum + (inv.totals_data?.due_amount || 0);
                return sum;
            }, 0),
            vds: filteredInvoices.reduce((sum, inv) => sum + (inv.vds || 0), 0),
            tds: filteredInvoices.reduce((sum, inv) => sum + (inv.tds || 0), 0),
            cogs: filteredInvoices.reduce((sum, inv) => sum + (inv.cogs || 0), 0),
            onTimeCount: onTimePayments.length,
            onTimeRate: paidInvoices.length > 0 ? ((onTimePayments.length / paidInvoices.length) * 100).toFixed(1) : 0
        };
    }, [filteredInvoices]);

    // Quotation metrics
    const quotationMetrics = useMemo(() => ({
        total: filteredQuotations.length,
        totalAmount: filteredQuotations.reduce((sum, q) => sum + (Number(q.total) || 0), 0),
        passed: filteredQuotations.filter(q => q.status === 'Passed').length,
        passedAmount: filteredQuotations.reduce((sum, q) => {
            if (q.status === 'Passed') return sum + (Number(q.total) || 0);
            return sum;
        }, 0),
        rejected: filteredQuotations.filter(q => q.status === 'Rejected').length,
        conversionRate: filteredQuotations.length > 0
            ? ((filteredQuotations.filter(q => q.status === 'Passed').length / filteredQuotations.length) * 100).toFixed(1)
            : 0
    }), [filteredQuotations]);

    // Service demand chart data
    const serviceChartData = useMemo(() => {
        const serviceCounts = {};
        filteredQuotations.forEach(q => {
            const serviceType = q.type || 'Other';
            serviceCounts[serviceType] = (serviceCounts[serviceType] || 0) + 1;
        });
        return Object.entries(serviceCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [filteredQuotations]);

    // Most quoted clients chart data
    const clientChartData = useMemo(() => {
        const clientCounts = {};
        filteredQuotations.forEach(q => {
            const clientName = q.to_company || 'Unknown';
            if (!clientCounts[clientName]) {
                clientCounts[clientName] = { name: clientName, count: 0, amount: 0 };
            }
            clientCounts[clientName].count += 1;
            clientCounts[clientName].amount += Number(q.total) || 0;
        });
        return Object.values(clientCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [filteredQuotations]);

    const formatCurrency = (value) => {
        return `${new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value || 0)} BDT`;
    };

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const quarters = ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'];
    // Always include 2 years of history and 1 year ahead so the list stays
    // current without manual updates.
    const currentYearNow = new Date().getFullYear();
    const years = [currentYearNow - 2, currentYearNow - 1, currentYearNow, currentYearNow + 1];

    const getFilterLabel = () => {
        if (timeFilter === 'month') return `${months[selectedMonth]} ${selectedYear}`;
        if (timeFilter === 'quarter') return `${quarters[selectedQuarter - 1]} ${selectedYear}`;
        return `${selectedYear}`;
    };

    if (loading) {
        return (
            <div className="min-h-full px-10 py-8 flex items-center justify-center">
                <p className="text-slate-500">Loading analytics...</p>
            </div>
        );
    }

    return (
        <div className="min-h-full px-10 py-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
                    <p className="text-sm text-slate-500">Business performance overview for {getFilterLabel()}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-600">Time:</span>
                    <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                        <option value="month">Month</option>
                        <option value="quarter">Quarter</option>
                        <option value="year">Year</option>
                    </select>

                    {timeFilter === 'month' && (
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-300"
                        >
                            {months.map((m, i) => (
                                <option key={i} value={i}>{m}</option>
                            ))}
                        </select>
                    )}

                    {timeFilter === 'quarter' && (
                        <select
                            value={selectedQuarter}
                            onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-300"
                        >
                            {quarters.map((q, i) => (
                                <option key={i} value={i + 1}>{q}</option>
                            ))}
                        </select>
                    )}

                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                <div className="h-6 w-px bg-slate-200" />

                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-600">Filters:</span>
                    <select
                        value={selectedClient}
                        onChange={(e) => setSelectedClient(e.target.value)}
                        className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                        <option value="all">All Clients</option>
                        {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <select
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                        className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                        <option value="all">All Services</option>
                        {services.map(s => (
                            <option key={s.id} value={s.code || s.name}>{s.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Invoice Analytics */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-slate-800">Invoice Analytics</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <MetricCard title="Total Invoices" value={invoiceMetrics.total} subtitle={formatCurrency(invoiceMetrics.totalAmount)} icon={FileText} color="blue" />
                    <MetricCard title="Payments Received" value={invoiceMetrics.paid} subtitle={formatCurrency(invoiceMetrics.paidAmount)} icon={CreditCard} color="green" />
                    <MetricCard title="Payments Pending" value={invoiceMetrics.pending} subtitle={formatCurrency(invoiceMetrics.pendingAmount)} icon={TrendingUp} color="amber" />
                    <MetricCard title="On-Time Payments" value={`${invoiceMetrics.onTimeRate}%`} subtitle={`${invoiceMetrics.onTimeCount} of ${invoiceMetrics.paid} paid`} icon={Clock} color="green" />
                    <MetricCard title="Net Profit" value="" subtitle={formatCurrency(invoiceMetrics.paidAmount - invoiceMetrics.cogs)} icon={BarChart3} color="purple" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100">
                        <p className="text-sm text-slate-500 mb-1">VAT Deducted</p>
                        <p className="text-xl font-semibold text-red-600">{formatCurrency(invoiceMetrics.vds)}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100">
                        <p className="text-sm text-slate-500 mb-1">AIT Deducted</p>
                        <p className="text-xl font-semibold text-purple-600">{formatCurrency(invoiceMetrics.tds)}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100">
                        <p className="text-sm text-slate-500 mb-1">COGS</p>
                        <p className="text-xl font-semibold text-slate-700">{formatCurrency(invoiceMetrics.cogs)}</p>
                    </div>
                </div>
            </section>

            {/* Quotation Analytics */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-emerald-600" />
                    <h2 className="text-lg font-semibold text-slate-800">Quotation Analytics</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard title="Total Quotations" value={quotationMetrics.total} subtitle={formatCurrency(quotationMetrics.totalAmount)} icon={FileText} color="blue" />
                    <MetricCard title="Passed" value={quotationMetrics.passed} subtitle={formatCurrency(quotationMetrics.passedAmount)} icon={TrendingUp} color="green" />
                    <MetricCard title="Rejected" value={quotationMetrics.rejected} subtitle="quotations" icon={BarChart3} color="red" />
                    <MetricCard title="Conversion Rate" value={`${quotationMetrics.conversionRate}%`} subtitle="Passed / Total" icon={Percent} color="purple" />
                </div>
            </section>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Service Demand Chart */}
                <section className="bg-white p-6 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-4">
                        <Briefcase className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-slate-800">Service Demand</h3>
                    </div>
                    {serviceChartData.length > 0 ? (
                        <div className="space-y-3">
                            {serviceChartData.map((item, idx) => {
                                const maxCount = serviceChartData[0]?.count || 1;
                                const percentage = (item.count / maxCount) * 100;
                                return (
                                    <div key={idx}>
                                        <div className="flex items-center justify-between text-sm mb-1">
                                            <span className="font-medium text-slate-700">{item.name}</span>
                                            <span className="text-slate-500">{item.count} quotations</span>
                                        </div>
                                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full transition-all"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-slate-400 text-center py-8">No data for selected period</p>
                    )}
                </section>

                {/* Most Quoted Clients Chart */}
                <section className="bg-white p-6 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="h-5 w-5 text-emerald-600" />
                        <h3 className="text-lg font-semibold text-slate-800">Most Quoted Clients</h3>
                    </div>
                    {clientChartData.length > 0 ? (
                        <div className="space-y-3">
                            {clientChartData.map((item, idx) => {
                                const maxCount = clientChartData[0]?.count || 1;
                                const percentage = (item.count / maxCount) * 100;
                                return (
                                    <div key={idx}>
                                        <div className="flex items-center justify-between text-sm mb-1">
                                            <span className="font-medium text-slate-700 truncate max-w-[200px]">{item.name}</span>
                                            <span className="text-slate-500">{item.count} quotes • {formatCurrency(item.amount)}</span>
                                        </div>
                                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full transition-all"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-slate-400 text-center py-8">No data for selected period</p>
                    )}
                </section>
            </div>

            {/* On-Time Payment Section */}
            <section className="bg-white p-6 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-slate-800">Payment Timeliness</h3>
                    <span className="text-xs text-slate-400">(Paid within 30 days of invoice)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="text-4xl font-bold text-green-600">{invoiceMetrics.onTimeRate}%</div>
                        <p className="text-sm text-slate-500 mt-1">On-Time Payment Rate</p>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-bold text-blue-600">{invoiceMetrics.onTimeCount}</div>
                        <p className="text-sm text-slate-500 mt-1">Paid On Time</p>
                    </div>
                    <div className="text-center">
                        <div className="text-4xl font-bold text-amber-600">{invoiceMetrics.paid - invoiceMetrics.onTimeCount}</div>
                        <p className="text-sm text-slate-500 mt-1">Paid Late</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

const MetricCard = ({ title, value, subtitle, icon: Icon, color }) => {
    const colorClasses = {
        blue: { iconBg: 'bg-blue-100', iconText: 'text-blue-600' },
        green: { iconBg: 'bg-emerald-100', iconText: 'text-emerald-600' },
        amber: { iconBg: 'bg-amber-100', iconText: 'text-amber-600' },
        red: { iconBg: 'bg-red-100', iconText: 'text-red-600' },
        purple: { iconBg: 'bg-purple-100', iconText: 'text-purple-600' }
    };
    const c = colorClasses[color] || colorClasses.blue;

    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-xl ${c.iconBg}`}>
                    <Icon className={`h-5 w-5 ${c.iconText}`} />
                </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">{title}</p>
            {value && <h3 className="text-2xl font-semibold text-slate-800">{value}</h3>}
            <p className={`text-sm font-medium ${c.iconText}`}>{subtitle}</p>
        </div>
    );
};

export default Analytics;
