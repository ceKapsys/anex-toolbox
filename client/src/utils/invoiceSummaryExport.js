// Builds and downloads a per-client invoice summary (CSV) for a month range.

const SUMMARY_HEADERS = [
    'Client Name',
    'Invoice Amount',
    'Vat Amount',
    'Payment Received',
    'Tax (AIT) Deducted',
    'VAT Deducted',
    'Receivable Amount'
];

const toNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
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

const getClientName = (inv) => {
    const c = inv.client_snapshot || {};
    return (c.name || c.company || 'Unknown Client').trim();
};

/**
 * Aggregates invoices per client for the inclusive month range [fromMonth, toMonth].
 * Months are "YYYY-MM" strings (the value format of <input type="month">).
 */
export const buildInvoiceSummary = (invoices, fromMonth, toMonth, { includeDrafts = false } = {}) => {
    const [start, end] = fromMonth <= toMonth ? [fromMonth, toMonth] : [toMonth, fromMonth];
    const byClient = new Map();

    for (const inv of invoices) {
        if (inv.status === 'Cancelled') continue;
        if (!includeDrafts && (inv.status || 'Draft') === 'Draft') continue;
        const key = getInvoiceMonthKey(inv);
        if (!key || key < start || key > end) continue;

        const name = getClientName(inv);
        const groupKey = name.toLowerCase();
        const row = byClient.get(groupKey) || {
            clientName: name,
            invoiceAmount: 0,
            vatAmount: 0,
            paymentReceived: 0,
            aitDeducted: 0,
            vatDeducted: 0,
            invoiceCount: 0
        };

        row.invoiceAmount += toNumber(inv.totals_data?.due_amount);
        row.vatAmount += toNumber(inv.totals_data?.total_vat);
        row.paymentReceived += toNumber(inv.amount_paid);
        row.aitDeducted += toNumber(inv.tds);
        row.vatDeducted += toNumber(inv.vds);
        row.invoiceCount += 1;
        byClient.set(groupKey, row);
    }

    const rows = [...byClient.values()]
        .map(r => ({
            ...r,
            receivableAmount: r.invoiceAmount - r.paymentReceived - r.aitDeducted - r.vatDeducted
        }))
        .sort((a, b) => a.clientName.localeCompare(b.clientName));

    const totals = rows.reduce((t, r) => ({
        invoiceAmount: t.invoiceAmount + r.invoiceAmount,
        vatAmount: t.vatAmount + r.vatAmount,
        paymentReceived: t.paymentReceived + r.paymentReceived,
        aitDeducted: t.aitDeducted + r.aitDeducted,
        vatDeducted: t.vatDeducted + r.vatDeducted,
        receivableAmount: t.receivableAmount + r.receivableAmount,
        invoiceCount: t.invoiceCount + r.invoiceCount
    }), {
        invoiceAmount: 0, vatAmount: 0, paymentReceived: 0,
        aitDeducted: 0, vatDeducted: 0, receivableAmount: 0, invoiceCount: 0
    });

    return { rows, totals, fromMonth: start, toMonth: end };
};

const csvCell = (value) => {
    const s = String(value ?? '');
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const money = (n) => toNumber(n).toFixed(2);

const rowToCells = (r, label) => [
    label ?? r.clientName,
    money(r.invoiceAmount),
    money(r.vatAmount),
    money(r.paymentReceived),
    money(r.aitDeducted),
    money(r.vatDeducted),
    money(r.receivableAmount)
];

export const invoiceSummaryToCsv = ({ rows, totals }) => {
    const lines = [
        SUMMARY_HEADERS,
        ...rows.map(r => rowToCells(r)),
        rowToCells(totals, 'Total')
    ];
    return lines.map(cells => cells.map(csvCell).join(',')).join('\r\n');
};

export const downloadInvoiceSummary = (summary) => {
    // BOM so Excel detects UTF-8 (client names may contain non-ASCII characters).
    const blob = new Blob(['﻿' + invoiceSummaryToCsv(summary)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = summary.fromMonth === summary.toMonth
        ? `invoice-summary_${summary.fromMonth}.csv`
        : `invoice-summary_${summary.fromMonth}_to_${summary.toMonth}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};
