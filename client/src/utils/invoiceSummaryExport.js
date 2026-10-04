// Builds and downloads a month-wise, per-client invoice summary (CSV) for a month range.

const SUMMARY_HEADERS = [
    'Month',
    'Client Name',
    'Invoice Amount',
    'Vat Amount',
    'Payment Received',
    'Tax (AIT) Deducted',
    'VAT Deducted',
    'Receivable Amount'
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const toNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

// "2026-09" -> "Sep 2026"
export const formatMonthLabel = (monthKey) => {
    const [y, m] = monthKey.split('-');
    return `${MONTH_NAMES[Number(m) - 1] || m} ${y}`;
};

// Returns "YYYY-MM" for an invoice, based on issue_date (falling back to created_at).
// issue_date is stored as "YYYY-MM-DD", so read it directly to avoid timezone shifts.
const getInvoiceMonthKey = (inv) => {
    const raw = inv.issue_date || inv.created_at;
    if (!raw) return null;
    const match = /^(\d{4})-(\d{2})/.exec(String(raw));
    if (match) return `${match[1]}-${match[2]}`;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const getInvoiceClientName = (inv) => {
    const c = inv.client_snapshot || {};
    return (c.name || c.company || 'Unknown Client').trim();
};

// Key used to group and filter clients; ignores case and extra whitespace.
export const clientKey = (name) => name.toLowerCase().replace(/\s+/g, ' ');

// Unique client names found on the given invoices, sorted alphabetically.
export const listInvoiceClients = (invoices) => {
    const names = new Map();
    for (const inv of invoices) {
        const name = getInvoiceClientName(inv);
        const key = clientKey(name);
        if (!names.has(key)) names.set(key, name);
    }
    return [...names.entries()]
        .map(([key, name]) => ({ key, name }))
        .sort((a, b) => a.name.localeCompare(b.name));
};

const emptyAmounts = () => ({
    invoiceAmount: 0,
    vatAmount: 0,
    paymentReceived: 0,
    aitDeducted: 0,
    vatDeducted: 0,
    receivableAmount: 0,
    invoiceCount: 0
});

const addAmounts = (target, src) => {
    target.invoiceAmount += src.invoiceAmount;
    target.vatAmount += src.vatAmount;
    target.paymentReceived += src.paymentReceived;
    target.aitDeducted += src.aitDeducted;
    target.vatDeducted += src.vatDeducted;
    target.receivableAmount += src.receivableAmount;
    target.invoiceCount += src.invoiceCount;
    return target;
};

/**
 * Aggregates invoices per month and client for the inclusive month range [fromMonth, toMonth].
 * Months are "YYYY-MM" strings (the value format of <input type="month">).
 * `clientKeys` limits the result to those clients (see clientKey); empty means all clients.
 */
export const buildInvoiceSummary = (invoices, fromMonth, toMonth, { includeDrafts = false, clientKeys = [] } = {}) => {
    const [start, end] = fromMonth <= toMonth ? [fromMonth, toMonth] : [toMonth, fromMonth];
    const clientFilter = clientKeys.length > 0 ? new Set(clientKeys) : null;
    const months = new Map(); // monthKey -> Map(clientKey -> row)

    for (const inv of invoices) {
        if (inv.status === 'Cancelled') continue;
        if (!includeDrafts && (inv.status || 'Draft') === 'Draft') continue;
        const month = getInvoiceMonthKey(inv);
        if (!month || month < start || month > end) continue;

        const name = getInvoiceClientName(inv);
        const key = clientKey(name);
        if (clientFilter && !clientFilter.has(key)) continue;

        if (!months.has(month)) months.set(month, new Map());
        const clients = months.get(month);
        const row = clients.get(key) || { clientName: name, ...emptyAmounts() };

        const invoiceAmount = toNumber(inv.totals_data?.due_amount);
        const paymentReceived = toNumber(inv.amount_paid);
        const aitDeducted = toNumber(inv.tds);
        const vatDeducted = toNumber(inv.vds);
        addAmounts(row, {
            invoiceAmount,
            vatAmount: toNumber(inv.totals_data?.total_vat),
            paymentReceived,
            aitDeducted,
            vatDeducted,
            receivableAmount: invoiceAmount - paymentReceived - aitDeducted - vatDeducted,
            invoiceCount: 1
        });
        clients.set(key, row);
    }

    const monthGroups = [...months.keys()].sort().map(month => {
        const rows = [...months.get(month).values()]
            .sort((a, b) => a.clientName.localeCompare(b.clientName));
        const totals = rows.reduce(addAmounts, emptyAmounts());
        return { month, label: formatMonthLabel(month), rows, totals };
    });

    const totals = monthGroups.reduce((t, g) => addAmounts(t, g.totals), emptyAmounts());

    return { months: monthGroups, totals, fromMonth: start, toMonth: end };
};

const csvCell = (value) => {
    const s = String(value ?? '');
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const money = (n) => toNumber(n).toFixed(2);

const amountCells = (r) => [
    money(r.invoiceAmount),
    money(r.vatAmount),
    money(r.paymentReceived),
    money(r.aitDeducted),
    money(r.vatDeducted),
    money(r.receivableAmount)
];

export const invoiceSummaryToCsv = ({ months }) => {
    const lines = [SUMMARY_HEADERS];
    for (const group of months) {
        for (const r of group.rows) {
            lines.push([group.label, r.clientName, ...amountCells(r)]);
        }
        lines.push([group.label, `${group.label} Total`, ...amountCells(group.totals)]);
        lines.push([]);
    }
    return lines.map(cells => cells.map(csvCell).join(',')).join('\r\n');
};

const fileSlug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const downloadInvoiceSummary = (summary, { clientLabel } = {}) => {
    // BOM so Excel detects UTF-8 (client names may contain non-ASCII characters).
    const blob = new Blob(['﻿' + invoiceSummaryToCsv(summary)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const range = summary.fromMonth === summary.toMonth
        ? summary.fromMonth
        : `${summary.fromMonth}_to_${summary.toMonth}`;
    const clientPart = clientLabel ? `_${fileSlug(clientLabel)}` : '';
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-summary${clientPart}_${range}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};
