/**
 * Quotation PDF Generator — pdfmake
 * Replicates the QuotationTemplate.jsx / quotation-print.css design exactly.
 * Font: Roboto (pdfmake built-in). Border-radius not supported in pdfmake
 * so borders are drawn as sharp rectangles.
 */
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.pdfMake?.vfs ?? pdfFonts.vfs ?? pdfFonts;
pdfMake.fonts = {
    Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-Italic.ttf',
    },
};

// ─── Layout constants ─────────────────────────────────────────────────────────
const PAGE_W = 595.28;  // A4 page width in points
const H_PAD = 32;       // horizontal content padding (matches .quotation-content padding: 0 32px)
const CONTENT_W = PAGE_W - H_PAD * 2; // ≈ 531pt

// Colours matching quotation-print.css
const C = {
    tealDark: '#1a4f5a',
    tealMed: '#5f929e',
    subtotalBg: '#bdc5c9',
    border: '#b0b8c1',
    rowAlt: '#f7f9fa',
    boxBg: '#f9fafb',
    rowSep: '#eef0f1',
    labelSep: '#e0e0e0',
    dark: '#111111',
    text: '#333333',
    med: '#374151',
    gray: '#444444',
    muted: '#4b5563',
    light: '#6b7280',
    white: '#ffffff',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
    new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(n) || 0);

const IMAGE_FETCH_TIMEOUT_MS = 8000;
const PDF_BLOB_TIMEOUT_MS = 20000;

// Yield control to the browser so React can commit pending state updates
// (e.g. the "Generating…" spinner) before heavy synchronous PDF work starts.
const yieldToMain = () => new Promise((resolve) => setTimeout(resolve, 0));

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
    const normalized = normalizeAssetValue(url);
    if (!normalized) return null;
    if (normalized.startsWith('data:')) return normalized;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);
    try {
        // credentials: 'include' ensures the session cookie is sent in case the
        // asset is served through an authenticated endpoint.
        const res = await fetch(normalized, { signal: controller.signal, credentials: 'include' });
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

/** Resolve image natural dimensions from a data-URL */
const getImageDimensions = (dataUrl) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = dataUrl;
});

const quotationPdfBlobCache = new Map();
const QUOTATION_PDF_CACHE_LIMIT = 20;

// Cheap, stable cache key that avoids JSON.stringify on the full data object.
// The full data object contains header_image and footer_image as large base64
// strings — stringifying them synchronously blocked the main thread for
// 1–3 s before generation even started.
const getQuotationCacheKey = (data) => [
    data?.quotation_number ?? '',
    data?.quotation_date ?? '',
    String(data?.grand_total ?? 0),
    String((data?.items ?? []).length),
    String((data?.items ?? []).reduce((s, i) => s + (Number(i.line_total) || 0), 0)),
].join('|');

const rememberQuotationBlob = (key, blob) => {
    if (quotationPdfBlobCache.has(key)) {
        quotationPdfBlobCache.delete(key);
    }
    quotationPdfBlobCache.set(key, blob);

    if (quotationPdfBlobCache.size > QUOTATION_PDF_CACHE_LIMIT) {
        const oldestKey = quotationPdfBlobCache.keys().next().value;
        quotationPdfBlobCache.delete(oldestKey);
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

// Reusable inline pdfmake layout objects
const boxLayout = {
    hLineColor: () => C.border,
    vLineColor: () => C.border,
    hLineWidth: () => 0.5,
    vLineWidth: () => 0.5,
    paddingLeft: () => 0,
    paddingRight: () => 0,
    paddingTop: () => 0,
    paddingBottom: () => 0,
};

// ─── Document builder ─────────────────────────────────────────────────────────
const buildDoc = (data, headerDataUrl, footerDataUrl, footerAreaHeight) => {
    const {
        quotation_number,
        quotation_date,
        valid_till_date,
        client = {},
        items = [],
        vat_percentage = 15,
        subtotal = 0,
        vat_amount = 0,
        grand_total = 0,
        terms_conditions,
        contact_details,
        disclaimer,
    } = data;

    const content = [];

    // ── Header image (full bleed) ─────────────────────────────────────────────
    if (headerDataUrl) {
        content.push({
            image: headerDataUrl,
            width: PAGE_W,
            margin: [0, 0, 0, 0],
        });
    }

    // ── Title "QUOTATION" ─────────────────────────────────────────────────────
    // Matches: .quotation-title { font-size:36px; color:#1a4f5a; letter-spacing:3px;
    //          margin:15px 0; text-align:center; }
    content.push({
        text: 'QUOTATION',
        fontSize: 27,
        bold: true,
        color: C.tealDark,
        alignment: 'center',
        characterSpacing: 3,
        margin: [H_PAD, 15, H_PAD, 8],
    });

    // ── Info Box ──────────────────────────────────────────────────────────────
    // Two equal columns. Left = QUOTATION TO / client. Right = Number/Date/Validity.
    // Matches: .quotation-info-box { border:1px solid #b0b8c1; display:flex; }
    //          .info-column { width:50%; padding:12px 16px; }
    //          .info-column:first-child { border-right:1px solid #b0b8c1; }

    // Left column stack
    const leftStack = [
        {
            // "QUOTATION TO" label with underline separator
            stack: [
                {
                    text: 'QUOTATION TO',
                    fontSize: 8.5,
                    bold: true,
                    color: C.tealDark,
                    characterSpacing: 0.6,
                    margin: [0, 0, 0, 5],
                },
                // Separator line mimicking border-bottom on .info-label-header
                {
                    canvas: [{
                        type: 'line',
                        x1: 0, y1: 0,
                        x2: CONTENT_W / 2 - 32, y2: 0,
                        lineWidth: 0.5,
                        lineColor: C.labelSep,
                    }],
                    margin: [0, 0, 0, 6],
                },
            ],
        },
        { text: client.name || '', fontSize: 10.5, bold: true, color: C.dark, margin: [0, 0, 0, 3] },
        { text: client.address || '', fontSize: 9, color: C.gray, margin: [0, 0, 0, 3] },
    ];
    if (client.attention) {
        leftStack.push({
            text: [
                { text: 'Attn: ', bold: true, color: C.tealDark, fontSize: 9 },
                { text: client.attention, fontSize: 9, color: C.gray },
            ],
        });
    }

    // Right column: info rows
    const infoRows = [
        ['Number', quotation_number || ''],
        ['Date', quotation_date || ''],
        ['Validity', valid_till_date || ''],
    ];
    const rightStack = infoRows.map(([label, val]) => ({
        columns: [
            { text: label, width: 65, fontSize: 9.5, bold: true, color: C.tealDark, margin: [0, 0, 0, 5] },
            { text: ':', width: 14, fontSize: 9.5, bold: true, alignment: 'center', margin: [0, 0, 0, 5] },
            { text: val, width: '*', fontSize: 9.5, bold: true, color: C.dark, margin: [0, 0, 0, 5] },
        ],
    }));

    content.push({
        table: {
            widths: ['*', '*'],
            body: [[
                {
                    stack: leftStack,
                    margin: [16, 12, 16, 12],
                    border: [true, true, true, true],
                },
                {
                    stack: rightStack,
                    margin: [16, 12, 16, 12],
                    border: [false, true, true, true],
                },
            ]],
        },
        layout: boxLayout,
        margin: [H_PAD, 0, H_PAD, 14],
    });

    // ── Items Table ───────────────────────────────────────────────────────────
    // Columns: SL fixed, Item auto (wider), Qty/Unit/Price narrowed to give Item more space
    const colW = [38, '*', 28, 38, 55, 65];

    const thCell = (text, align = 'left') => ({
        text,
        fontSize: 9.5,
        bold: true,
        color: C.white,
        fillColor: C.tealDark,
        alignment: align,
    });

    const headerRow = [
        thCell('SL', 'center'),
        thCell('Item'),
        thCell('Qty', 'center'),
        thCell('Unit', 'center'),
        thCell('Price', 'right'),
        thCell('Total', 'right'),
    ];

    const dataRows = items.map((item, idx) => {
        const fill = idx % 2 === 0 ? C.white : C.rowAlt;
        const slNum = String(idx + 1).padStart(2, '0');

        // Item cell: title (bold) + optional description (smaller, gray)
        const itemCellStack = [
            { text: item.title || '', fontSize: 9.5, bold: true, color: C.dark },
        ];
        if (item.description) {
            itemCellStack.push({
                text: item.description,
                fontSize: 8.5,
                color: C.light,
                alignment: 'justify',
                margin: [0, 1, 0, 0],
            });
        }

        return [
            { text: slNum, fontSize: 9.5, color: C.text, alignment: 'center', fillColor: fill },
            { stack: itemCellStack, fillColor: fill },
            { text: String(item.qty ?? ''), fontSize: 9.5, color: C.text, alignment: 'center', fillColor: fill },
            { text: item.unit || '', fontSize: 9.5, color: C.text, alignment: 'center', fillColor: fill },
            { text: fmt(item.price), fontSize: 9.5, color: C.text, alignment: 'right', fillColor: fill },
            { text: fmt(item.line_total), fontSize: 9.5, color: C.text, alignment: 'right', fillColor: fill },
        ];
    });

    content.push({
        table: {
            widths: colW,
            headerRows: 1,
            body: [headerRow, ...dataRows],
        },
        layout: {
            // No vertical lines; horizontal lines only between rows
            hLineWidth: (i, node) => {
                if (i === 0) return 0;                         // no top border
                if (i === node.table.body.length) return 0;   // no bottom border
                return 0.5;
            },
            vLineWidth: () => 0,
            hLineColor: (i) => (i === 1 ? C.tealDark : C.rowSep),
            paddingLeft: () => 10,
            paddingRight: () => 10,
            paddingTop: (i) => (i <= 1 ? 7 : 6),
            paddingBottom: (i) => (i <= 1 ? 7 : 6),
        },
        margin: [H_PAD, 0, H_PAD, 6],
    });

    // ── Financial Summary ─────────────────────────────────────────────────────
    // Right-aligned block matching items table right edge.
    // Row fill colours: subtotal=#bdc5c9, vat=#5f929e, total=#1a4f5a
    const SUMMARY_W = Math.round(CONTENT_W * 0.40); // ≈ 212pt
    const VAL_W = 100;

    const sumRow = (label, value, valueBg) => [
        {
            text: label,
            fontSize: 10,
            bold: true,
            color: C.med,
            alignment: 'right',
            margin: [0, 0, 16, 0],
        },
        {
            text: value,
            fontSize: 10,
            bold: true,
            color: C.white,
            fillColor: valueBg,
            alignment: 'right',
        },
    ];

    const summaryTable = {
        width: SUMMARY_W,
        table: {
            widths: ['*', VAL_W],
            body: [
                sumRow('Subtotal', fmt(subtotal), C.subtotalBg),
                sumRow(`VAT (${vat_percentage}%)`, fmt(vat_amount), C.tealMed),
                sumRow('Total', `${fmt(grand_total)} BDT`, C.tealDark),
            ],
        },
        layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            paddingLeft: () => 0,
            paddingRight: () => 10,
            paddingTop: () => 5,
            paddingBottom: () => 5,
        },
    };

    // Use spacer column to right-align the summary block
    content.push({
        columns: [{ text: '', width: '*' }, summaryTable],
        margin: [H_PAD, 0, H_PAD, 12],
    });

    // ── Footer Grid (Terms + Contact) ─────────────────────────────────────────
    // Two equal boxes side by side.
    // Matches: .footer-box { border:1px solid #b0b8c1; background:#f9fafb; padding:10px 14px }

    const makeFooterBox = (titleText, stackItems) => ({
        width: '*',
        table: {
            widths: ['*'],
            body: [[{
                stack: [
                    {
                        text: titleText,
                        fontSize: 9.5,
                        bold: true,
                        decoration: 'underline',
                        color: C.dark,
                        margin: [0, 0, 0, 6],
                    },
                    ...stackItems,
                ],
                fillColor: C.boxBg,
                margin: [14, 10, 14, 10],
            }]],
        },
        layout: boxLayout,
    });

    // Terms & Conditions content
    const termsLines = (terms_conditions || '')
        .split('\n')
        .filter((l) => l.trim())
        .map((l) => ({
            text: `• ${l.trim().replace(/^[-•*]\s*/, '')}`,
            fontSize: 8.5,
            color: C.med,
            margin: [0, 1, 0, 1],
        }));

    const termsBoxDef = makeFooterBox(
        'Terms & Conditions',
        termsLines.length ? termsLines : [{ text: '', fontSize: 8.5 }],
    );

    const hasContact = contact_details && contact_details.name;

    if (hasContact) {
        const contactItems = [
            { text: contact_details.name, fontSize: 10, bold: true, color: C.dark, margin: [0, 0, 0, 1] },
        ];
        if (contact_details.designation) {
            contactItems.push({ text: contact_details.designation, fontSize: 8.5, color: C.muted, margin: [0, 0, 0, 5] });
        }
        if (contact_details.phone) {
            contactItems.push({ text: `Phone: ${contact_details.phone}`, fontSize: 8.5, color: C.med, margin: [0, 0, 0, 1] });
        }
        if (contact_details.email) {
            contactItems.push({ text: `Email: ${contact_details.email}`, fontSize: 8.5, color: C.med, margin: [0, 0, 0, 1] });
        }

        const contactBoxDef = makeFooterBox('Contact Details', contactItems);

        content.push({
            columns: [termsBoxDef, { width: 16, text: '' }, contactBoxDef],
            margin: [H_PAD, 0, H_PAD, 0],
        });
    } else {
        content.push({
            columns: [termsBoxDef],
            margin: [H_PAD, 0, H_PAD, 0],
        });
    }

    // ── Disclaimer + Footer image are rendered via pdfmake footer callback ────
    // so they always stick to the very bottom of each page with zero gap.

    const footerFn = footerAreaHeight > 0 ? () => {
        const items = [];
        if (disclaimer) {
            items.push({
                text: disclaimer,
                fontSize: 7.5,
                color: C.light,
                alignment: 'center',
                margin: [H_PAD, 2, H_PAD, 0],
            });
        }
        if (footerDataUrl) {
            items.push({ image: footerDataUrl, width: PAGE_W });
        }
        return { stack: items, margin: [0, 0, 0, 0] };
    } : undefined;

    return {
        pageSize: 'A4',
        pageMargins: [0, 0, 0, footerAreaHeight],
        footer: footerFn,
        defaultStyle: { font: 'Roboto', fontSize: 10, color: C.text },
        content,
    };
};

// ─── Public API ───────────────────────────────────────────────────────────────

/** Calculate the exact footer area height (disclaimer + footer image) */
const calcFooterHeight = async (data, footerDataUrl) => {
    let h = 0;
    if (data.disclaimer) h += 12; // fontSize 7.5 + margin
    if (footerDataUrl) {
        const dims = await getImageDimensions(footerDataUrl);
        if (dims) h += (dims.height / dims.width) * PAGE_W;
    }
    return h;
};

const buildQuotationPDFBlob = async (data) => {
    // Yield to the browser first so any pending React renders (e.g. the
    // "Generating…" spinner) are committed before the synchronous pdfmake
    // layout engine takes over the main thread.
    await yieldToMain();

    const [headerDataUrl, footerDataUrl] = await Promise.all([
        toDataUrl(data.header_image),
        toDataUrl(data.footer_image),
    ]);
    const footerAreaHeight = await calcFooterHeight(data, footerDataUrl);
    const docDef = buildDoc(data, headerDataUrl, footerDataUrl, footerAreaHeight);

    return new Promise((resolve, reject) => {
        let settled = false;
        const timeoutId = setTimeout(() => {
            if (settled) return;
            settled = true;
            reject(new Error('Quotation PDF blob generation timed out.'));
        }, PDF_BLOB_TIMEOUT_MS);

        try {
            pdfMake.createPdf(docDef).getBlob((blob) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeoutId);
                if (!blob) {
                    reject(new Error('Quotation PDF blob is empty.'));
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

export const downloadQuotationPDF = async (data, filename = 'quotation.pdf') => {
    try {
        const cacheKey = getQuotationCacheKey(data);
        const cachedBlob = quotationPdfBlobCache.get(cacheKey);
        if (cachedBlob) {
            blobToDownload(cachedBlob, filename);
            return;
        }

        try {
            const blob = await buildQuotationPDFBlob(data);
            rememberQuotationBlob(cacheKey, blob);
            blobToDownload(blob, filename);
        } catch (err) {
            if (String(err?.message || '').includes('timed out')) {
                // Fallback: use pdfmake's built-in download which bypasses the
                // getBlob callback path that occasionally stalls in some browsers.
                const [headerDataUrl, footerDataUrl] = await Promise.all([
                    toDataUrl(data.header_image),
                    toDataUrl(data.footer_image),
                ]);
                const footerAreaHeight = await calcFooterHeight(data, footerDataUrl);
                const docDef = buildDoc(data, headerDataUrl, footerDataUrl, footerAreaHeight);
                pdfMake.createPdf(docDef).download(filename);
                return;
            }
            throw err;
        }
    } catch (err) {
        console.error('pdfmake quotation generation failed:', err);
        throw err;
    }
};

export const getQuotationPDFBlob = async (data) => {
    const cacheKey = getQuotationCacheKey(data);
    const cachedBlob = quotationPdfBlobCache.get(cacheKey);
    if (cachedBlob) {
        return cachedBlob;
    }

    const blob = await buildQuotationPDFBlob(data);
    rememberQuotationBlob(cacheKey, blob);
    return blob;
};
