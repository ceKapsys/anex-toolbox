/**
 * Invoice PDF Generator — pdfmake (Mushak 6.3 Tax Invoice)
 * Font: Helvetica (standard PDF font, no embedding needed, no vfs required)
 * All 11 table columns fit within A4 with noWrap on number cells.
 */
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Wire fonts for Roboto fallback (needed by pdfmake internals)
pdfMake.vfs = pdfFonts.pdfMake?.vfs ?? pdfFonts.vfs ?? pdfFonts;

// Use the bundled explicitly (Roboto) instead of standard fonts to avoid .afm missing errors
pdfMake.fonts = {
    Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-Italic.ttf'
    }
};

// Custom table layouts
pdfMake.tableLayouts = {
    cleanBox: {
        hLineColor: () => '#9ca3af',
        vLineColor: () => '#9ca3af',
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        paddingLeft: () => 0,
        paddingRight: () => 0,
        paddingTop: () => 0,
        paddingBottom: () => 0,
    },
    noBorders: {
        hLineWidth: () => 0,
        vLineWidth: () => 0,
        paddingLeft: () => 0,
        paddingRight: () => 0,
        paddingTop: () => 0,
        paddingBottom: () => 0,
    },
    tagBox: {
        hLineColor: () => '#374151',
        vLineColor: () => '#374151',
        hLineWidth: () => 0.75,
        vLineWidth: () => 0.75,
        paddingLeft: () => 0,
        paddingRight: () => 0,
        paddingTop: () => 0,
        paddingBottom: () => 0,
    },
    // Items grid: tight padding to fit 11 columns
    itemsGrid: {
        hLineColor: () => '#9ca3af',
        vLineColor: () => '#9ca3af',
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        paddingLeft: () => 2,
        paddingRight: () => 2,
        paddingTop: () => 2,
        paddingBottom: () => 2,
    },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n) =>
    new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(n) || 0);

const IMAGE_FETCH_TIMEOUT_MS = 8000;
const PDF_BLOB_TIMEOUT_MS = 90000;
const API_URL = import.meta.env.VITE_API_URL || '/api';

const getApiOrigin = () => {
    if (typeof window === 'undefined') return '';
    if (API_URL.startsWith('http://') || API_URL.startsWith('https://')) {
        try {
            return new URL(API_URL).origin;
        } catch {
            return window.location.origin;
        }
    }
    return window.location.origin;
};

const normalizeAssetUrl = (url) => {
    if (!url || typeof url !== 'string') return url;
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('//')) return `${window.location.protocol}${url}`;
    if (url.startsWith('/')) return `${getApiOrigin()}${url}`;
    return url;
};

const normalizeAssetValue = (value) => {
    if (!value || typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
};

const toDataUrl = async (url) => {
    const normalizedValue = normalizeAssetValue(url);
    if (!normalizedValue) return null;
    if (normalizedValue.startsWith('data:')) return normalizedValue;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);
    try {
        const resolvedUrl = normalizeAssetUrl(normalizedValue);
        const res = await fetch(resolvedUrl, {
            signal: controller.signal,
            credentials: 'include',
        });
        if (!res.ok) return null;
        const blob = await res.blob();
        return await new Promise((resolve) => {
            const r = new FileReader();
            r.onloadend = () => resolve(r.result);
            r.readAsDataURL(blob);
        });
    } catch {
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
};

const invoicePdfBlobCache = new Map();
const INVOICE_PDF_CACHE_LIMIT = 20;

const getInvoiceCacheKey = (data) => JSON.stringify(data || {});

const rememberInvoiceBlob = (key, blob) => {
    if (invoicePdfBlobCache.has(key)) {
        invoicePdfBlobCache.delete(key);
    }
    invoicePdfBlobCache.set(key, blob);

    if (invoicePdfBlobCache.size > INVOICE_PDF_CACHE_LIMIT) {
        const oldestKey = invoicePdfBlobCache.keys().next().value;
        invoicePdfBlobCache.delete(oldestKey);
    }
};

const blobToDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
};

const buildInvoicePDFBlob = async (data) => {
    const companyLogo = normalizeAssetValue(data.company_logo || data.company_details?.logo || data.company_details?.company_logo || '');
    const bankLogo = normalizeAssetValue(data.bank_details?.logo || data.bank_details?.bank_logo || '');
    const [logoUrl, bankLogoUrl] = await Promise.all([
        toDataUrl(companyLogo),
        toDataUrl(bankLogo),
    ]);
    const docDef = buildDoc(data, logoUrl, bankLogoUrl);
    return new Promise((resolve, reject) => {
        let settled = false;
        const timeoutId = setTimeout(() => {
            if (settled) return;
            settled = true;
            reject(new Error('Invoice PDF blob generation timed out.'));
        }, PDF_BLOB_TIMEOUT_MS);

        try {
            pdfMake.createPdf(docDef).getBlob((blob) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeoutId);
                if (!blob) {
                    reject(new Error('Invoice PDF blob is empty.'));
                    return;
                }
                resolve(blob);
            });
        } catch (err) {
            if (!settled) {
                settled = true;
                clearTimeout(timeoutId);
            }
            reject(err);
        }
    });
};

// ─── Reusable element builders ────────────────────────────────────────────────

const sectionBox = (title, bodyStack, margin = [0, 0, 0, 5]) => ({
    table: {
        widths: ['*'],
        body: [
            [{
                text: title,
                fontSize: 8.5, bold: true, alignment: 'center',
                color: '#111111', fillColor: '#e5e7eb',
                margin: [0, 3, 0, 3], border: [true, true, true, true],
            }],
            [{
                stack: Array.isArray(bodyStack) ? bodyStack : [bodyStack],
                margin: [10, 3, 10, 4],
                border: [true, false, true, true],
            }],
        ],
    },
    layout: 'cleanBox',
    margin,
});

const mathBox = (label, value) => ({
    table: {
        widths: [90],
        body: [
            [{ text: label, fontSize: 7.5, bold: true, alignment: 'center', fillColor: '#e5e7eb', color: '#111', margin: [0, 2, 0, 2], border: [true, true, true, true] }],
            [{ text: value, fontSize: 10, bold: true, alignment: 'center', color: '#111', margin: [0, 4, 0, 4], border: [true, false, true, true] }],
        ],
    },
    layout: 'cleanBox',
});

const op = (ch) => ({
    width: 14, text: ch, fontSize: 13, bold: true,
    color: '#111', alignment: 'center', margin: [0, 12, 0, 0],
});

const infoTable = (rows) => ({
    table: {
        widths: [90, 8, '*'],
        body: rows.map(([label, val]) => [
            { text: label, fontSize: 8.5, color: '#111', noWrap: true },
            { text: ':', fontSize: 8.5, alignment: 'center', color: '#111' },
            { text: val || '', fontSize: 8.5, color: '#111' },
        ]),
    },
    layout: 'noBorders',
});

// ─── Document builder ─────────────────────────────────────────────────────────

const buildDoc = (data, logoDataUrl, bankLogoDataUrl) => {
    const {
        company_details, client, invoice_no, issue_date, due_date,
        time_f, quote_ref, work_order_ref, approved_by,
        items = [], total_qty, total_ex_vat, total_sd, total_vat,
        due_amount, adjust_amount, adjust_note, amount_in_words,
        terms_text, bank_details, disclaimer,
    } = data;

    // ── Header ───────────────────────────────────────────────────────────────
    const logoCell = logoDataUrl
        ? { width: 95, image: logoDataUrl, fit: [90, 55] }
        : { width: 95, text: '', fontSize: 9 };

    const taxInvoiceBox = {
        table: { widths: ['auto'], body: [[{ text: 'TAX INVOICE', fontSize: 9, bold: true, margin: [12, 2, 12, 2], border: [true, true, true, true], color: '#111' }]] },
        layout: 'tagBox',
    };
    const mushakBox = {
        table: { widths: ['auto'], body: [[{ text: 'MUSHAK 6.3', fontSize: 9, bold: true, margin: [8, 2, 8, 2], border: [true, true, true, true], color: '#111' }]] },
        layout: 'tagBox',
    };

    const header = {
        columns: [
            logoCell,
            {
                width: '*',
                stack: [
                    { text: "GOVERNMENT OF THE PEOPLE'S REPUBLIC OF BANGLADESH", fontSize: 8.5, bold: true, alignment: 'center' },
                    { text: 'NATIONAL BOARD OF REVENUE (NBR)', fontSize: 8.5, bold: true, alignment: 'center', margin: [0, 1, 0, 3] },
                    { columns: [{ width: '*', text: '' }, taxInvoiceBox, { width: '*', text: '' }] },
                ],
            },
            { width: 85, stack: [{ text: '', fontSize: 1 }, mushakBox] },
        ],
        margin: [0, 0, 0, 10],
    };

    // ── Business info ─────────────────────────────────────────────────────────
    const bizInfo = sectionBox('REGISTERED BUSINESS INFO', [
        { text: [{ text: 'Business Name:  ', bold: true }, company_details?.name || ''], alignment: 'center', fontSize: 9, margin: [0, 0, 0, 1] },
        { text: [{ text: 'BIN Number:  ', bold: true }, company_details?.bin || ''], alignment: 'center', fontSize: 9, margin: [0, 0, 0, 1] },
        { text: [{ text: 'Address:  ', bold: true }, company_details?.address || ''], alignment: 'center', fontSize: 9 },
    ], [0, 0, 0, 10]);

    // ── Two-column Buyer / Invoice ─────────────────────────────────────────────
    const invoiceRows = [
        ['Invoice Number', invoice_no],
        ['Invoice Issue Date', issue_date],
        ['Invoice Due Date', due_date],
        ...(time_f ? [['Invoice Time', time_f]] : []),
        ...(quote_ref ? [['Quotation Ref', quote_ref]] : []),
        ...(work_order_ref ? [['Work Order Ref', work_order_ref]] : []),
        ...(approved_by ? [['Approved By', approved_by]] : []),
    ];

    const twoCol = {
        columns: [
            sectionBox('BUYER INFORMATION', [infoTable([['Buyer Name', client?.name], ['Buyer BIN', client?.bin], ['Buyer Address', client?.address]])], [0, 0, 0, 0]),
            { width: 6, text: '' },
            sectionBox('INVOICE INFORMATION', [infoTable(invoiceRows)], [0, 0, 0, 0]),
        ],
        margin: [0, 0, 0, 10],
    };

    // ── Items table — 11 columns, ALL fit within A4 content width (543pt) ────
    //  Content width = 595.28 - 26 - 26 = 543.28pt
    //  With 0.5pt borders × 12 lines ≈ 6pt overhead → target column sum ≤ 537pt
    //
    //  SL | Description | Unit | Qty | PUP | TP | SDR | SDA | VATR | VATA | TP
    const colW = [18, 100, 48, 20, 50, 48, 34, 42, 32, 42, 55];
    //            20 + 108 + 52 + 20 + 52 + 50 + 36 + 44 + 34 + 44 + 57 = 517
    // (pdfmake padding: 2+2 per cell × 11 = 44pt extra → 517 + ~20 overhead = stays within 543)

    const th = (text, align = 'center', fill = '#e5e7eb', wrap = false) => ({
        text, fontSize: 7, bold: true, alignment: align,
        fillColor: fill, color: '#111', margin: [0, 2, 0, 2],
        noWrap: !wrap,
    });

    // Number column header — can wrap so multi-word fits
    const thWrap = (text, align = 'center', fill = '#e5e7eb') =>
        ({ ...th(text, align, fill, true), lineHeight: 1.2 });

    const td = (text, align = 'center', bold = false, fill = '#ffffff', wrap = false) => ({
        text: String(text ?? ''), fontSize: 7.5, alignment: align,
        bold, fillColor: fill, color: '#111', margin: [0, 1, 0, 1],
        noWrap: !wrap,  // numbers: noWrap=true, description: noWrap=false
    });

    const dataRows = items.map((item, idx) => {
        const fill = idx % 2 === 1 ? '#f9fafb' : '#ffffff';
        return [
            td(idx + 1, 'center', false, fill),
            td(item.desc || item.title || '', 'left', false, fill, true), // description wraps
            td(item.unit || '', 'center', false, fill),
            td(item.qty, 'center', false, fill),
            td(fmt(item.price), 'right', false, fill),
            td(fmt(item.base_total), 'right', false, fill),
            td(item.sd > 0 ? `${item.sd}%` : '-', 'center', false, fill),
            td(item.sd > 0 ? fmt(item.sd_amount) : '-', 'right', false, fill),
            td(`${item.vat}%`, 'center', false, fill),
            td(fmt(item.vat_amount), 'right', false, fill),
            td(fmt(item.line_total), 'right', true, fill),
        ];
    });

    const totalRow = [
        { text: 'Total', colSpan: 3, alignment: 'right', bold: true, fontSize: 7.5, fillColor: '#f3f4f6', color: '#111', margin: [0, 2, 4, 2], noWrap: true },
        {}, {},
        td(fmt(total_qty), 'center', true, '#f3f4f6'),
        td('', 'center', false, '#f3f4f6'),
        td(fmt(total_ex_vat), 'right', true, '#f3f4f6'),
        td('', 'center', false, '#f3f4f6'),
        td(fmt(total_sd), 'right', true, '#f3f4f6'),
        td('', 'center', false, '#f3f4f6'),
        td(fmt(total_vat), 'right', true, '#f3f4f6'),
        td(fmt(due_amount + (Number(adjust_amount) || 0)), 'right', true, '#f3f4f6'),
    ];

    const itemsTable = {
        table: {
            widths: colW,
            body: [
                // Number row
                ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'].map(n => th(n, 'center', '#f3f4f6')),
                // Header row (wrappable)
                [thWrap('SL No.'), thWrap('Description', 'left'), thWrap('Unit of\nSupply'), thWrap('Qty'), thWrap('Per Unit\nPrice'), thWrap('Total\nPrice'), thWrap('SD\nRate'), thWrap('SD\nAmount'), thWrap('VAT\nRate'), thWrap('VAT\nAmount'), thWrap('Total\nPrice')],
                ...dataRows,
                totalRow,
            ],
        },
        layout: 'itemsGrid',
        margin: [0, 0, 0, 4],
    };

    // ── Totals ────────────────────────────────────────────────────────────────
    const wordsLine = {
        text: `Total in Words: ${amount_in_words || ''} Taka Only`,
        fontSize: 9, bold: true, italics: true, margin: [0, 4, 0, 6],
    };

    const mathRow = {
        alignment: 'center',
        columns: [
            { width: '*', text: '' },
            mathBox('Net Amount', fmt(total_ex_vat)),
            op('+'),
            mathBox('VAT Amount', fmt(total_vat)),
            op('-'),
            mathBox('Adjustment', adjust_amount ? fmt(adjust_amount) : '-'),
            op('='),
            mathBox('Due Amount', fmt(due_amount)),
            { width: '*', text: '' },
        ],
        margin: [0, 4, 0, 10],
    };

    // ── Pay bar ───────────────────────────────────────────────────────────────
    const payBar = {
        table: {
            widths: ['*'],
            body: [[{
                text: `Please pay BDT ${fmt(due_amount)}`,
                color: '#ffffff', fillColor: '#111827',
                bold: true, fontSize: 11.5, alignment: 'center',
                margin: [8, 5, 8, 5], border: [false, false, false, false],
            }]],
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 6],
    };

    // ── Terms ─────────────────────────────────────────────────────────────────
    const termLines = (terms_text || '')
        .split('\n').map(l => l.trim()).filter(Boolean)
        .map(l => ({ text: `• ${l.replace(/^[-•*]\s*/, '')}`, fontSize: 8, margin: [0, 1, 0, 0] }));

    const termsBox = {
        table: {
            widths: ['*'],
            body: [[{
                stack: [
                    { text: 'Terms & Conditions', fontSize: 9.5, bold: true, decoration: 'underline', margin: [0, 0, 0, 4] },
                    ...(termLines.length ? termLines : [{ text: '', fontSize: 8 }]),
                ],
                margin: [10, 7, 10, 7], border: [true, true, true, true],
            }]],
        },
        layout: 'cleanBox',
        margin: [0, 0, 0, 5],
    };

    // ── Payment method ────────────────────────────────────────────────────────
    const logoCol = bankLogoDataUrl
        ? { width: 58, image: bankLogoDataUrl, fit: [50, 34], margin: [0, 2, 10, 2] }
        : { width: 58, text: (bank_details?.bank || '').substring(0, 3).toUpperCase(), fontSize: 11, bold: true, color: '#374151', alignment: 'center', margin: [0, 6, 10, 6] };

    const paymentSection = {
        table: {
            widths: ['*'],
            body: [
                [{ text: 'PAYMENT METHOD', fontSize: 9, bold: true, alignment: 'center', fillColor: '#dbeafe', color: '#111', margin: [0, 3, 0, 3], border: [true, true, true, true] }],
                [{
                    columns: [
                        logoCol,
                        { width: 1, canvas: [{ type: 'line', x1: 0, y1: 0, x2: 0, y2: 38, lineWidth: 0.5, lineColor: '#dde0e3' }] },
                        {
                            width: '*', margin: [10, 2, 0, 2],
                            stack: [
                                { text: [{ text: 'BANK: ', bold: true, color: '#374151', fontSize: 8.5 }, { text: bank_details?.bank || '', bold: true, fontSize: 8.5, noWrap: true }, { text: '   |   ', color: '#9ca3af', fontSize: 8.5 }, { text: 'A/C NAME: ', bold: true, color: '#374151', fontSize: 8.5 }, { text: bank_details?.ac_name || '', bold: true, fontSize: 8.5 }], margin: [0, 0, 0, 4] },
                                { text: [{ text: 'A/C NO.: ', bold: true, color: '#374151', fontSize: 8.5 }, { text: bank_details?.ac_no || '', bold: true, fontSize: 8.5, noWrap: true }, { text: '   |   ', color: '#9ca3af', fontSize: 8.5 }, { text: 'ROUTING: ', bold: true, color: '#374151', fontSize: 8.5 }, { text: bank_details?.routing || '', bold: true, fontSize: 8.5 }] },
                            ],
                        },
                    ],
                    margin: [8, 6, 8, 6], border: [true, false, true, true],
                }],
            ],
        },
        layout: 'cleanBox',
        margin: [0, 0, 0, 4],
    };

    // ── Footer ────────────────────────────────────────────────────────────────
    const footerNote = {
        stack: [
            { text: disclaimer || 'This invoice is generated by ANEX Invoice Engine. Doesn\'t require a signature to validate.', fontSize: 7.5, alignment: 'center', color: '#6b7280', margin: [0, 0, 0, 2] },
            { text: [{ text: 'For any issues please contact ', fontSize: 7.5, color: '#6b7280' }, { text: 'finance@anexbusiness.com', fontSize: 7.5, color: '#1d4ed8', bold: true }], alignment: 'center' },
        ],
    };

    const adjNote = adjust_note
        ? [{ text: [{ text: 'Adjustment Note: ', bold: true }, adjust_note], fontSize: 8.5, color: '#374151', margin: [0, 0, 0, 4] }]
        : [];

    return {
        pageSize: 'A4',
        pageMargins: [26, 30, 26, 15],
        defaultStyle: { font: 'Roboto', fontSize: 9, color: '#111111' },
        content: [header, bizInfo, twoCol, itemsTable, wordsLine, ...adjNote, mathRow, payBar, termsBox, paymentSection, footerNote],
    };
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const downloadInvoicePDF = async (data, filename = 'invoice.pdf') => {
    try {
        const cacheKey = getInvoiceCacheKey(data);
        const cachedBlob = invoicePdfBlobCache.get(cacheKey);
        if (cachedBlob) {
            blobToDownload(cachedBlob, filename);
            return;
        }

        try {
            const blob = await buildInvoicePDFBlob(data);
            rememberInvoiceBlob(cacheKey, blob);
            blobToDownload(blob, filename);
        } catch (err) {
            if (String(err?.message || '').includes('blob generation timed out')) {
                // Fallback path for browsers where getBlob callback stalls.
                const [logoUrl, bankLogoUrl] = await Promise.all([
                    toDataUrl(data.company_logo || data.company_details?.logo || data.company_details?.company_logo || ''),
                    toDataUrl(data.bank_details?.logo || data.bank_details?.bank_logo || ''),
                ]);
                const docDef = buildDoc(data, logoUrl, bankLogoUrl);
                pdfMake.createPdf(docDef).download(filename);
                return;
            }
            throw err;
        }
    } catch (err) {
        console.error('pdfmake invoice generation failed:', err);
        throw err;
    }
};

export const getInvoicePDFBlob = async (data) => {
    const cacheKey = getInvoiceCacheKey(data);
    const cachedBlob = invoicePdfBlobCache.get(cacheKey);
    if (cachedBlob) {
        return cachedBlob;
    }

    const blob = await buildInvoicePDFBlob(data);
    rememberInvoiceBlob(cacheKey, blob);
    return blob;
};
