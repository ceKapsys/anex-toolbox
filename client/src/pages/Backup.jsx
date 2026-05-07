import React, { useState, useRef } from 'react';
import { Download, Upload, FileJson, CheckCircle, AlertCircle, Loader2, RotateCcw, Receipt, FileText } from 'lucide-react';
import api from '../lib/api';

// ── Shared sub-components ─────────────────────────────────────────────────────

const ResultBanner = ({ result, onDismiss }) => {
    if (!result) return null;
    const hasErrors = result.errors && result.errors.length > 0;
    const isError = result.type === 'error';

    return (
        <div className={`mt-4 rounded-2xl p-4 text-sm ${isError ? 'bg-rose-50 border border-rose-200' : 'bg-emerald-50 border border-emerald-200'}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                    {isError
                        ? <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                        : <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    }
                    <div>
                        {isError
                            ? <p className="font-medium text-rose-700">{result.message}</p>
                            : (
                                <p className="font-medium text-emerald-700">
                                    Import complete — <span className="font-bold">{result.imported}</span> imported,{' '}
                                    <span className="font-bold">{result.skipped}</span> skipped (already exist)
                                </p>
                            )
                        }
                        {hasErrors && (
                            <ul className="mt-2 space-y-1 text-xs text-rose-600">
                                {result.errors.slice(0, 10).map((e, i) => (
                                    <li key={i}>• {e.invoice_no || e.quotation_number || 'Record'}: {e.error}</li>
                                ))}
                                {result.errors.length > 10 && (
                                    <li>…and {result.errors.length - 10} more errors</li>
                                )}
                            </ul>
                        )}
                    </div>
                </div>
                <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600 flex-shrink-0 text-lg leading-none">&times;</button>
            </div>
        </div>
    );
};

// ── Per-document backup panel ─────────────────────────────────────────────────

const BackupPanel = ({ title, description, icon: Icon, color, onDownload, onRestore }) => {
    const fileRef = useRef(null);
    const [file, setFile] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [result, setResult] = useState(null);

    const colorMap = {
        blue: {
            icon: 'bg-blue-100 text-blue-600',
            badge: 'bg-blue-600',
            ring: 'focus:ring-blue-400',
            border: 'border-blue-200',
            uploadHover: 'hover:border-blue-400 hover:bg-blue-50',
        },
        emerald: {
            icon: 'bg-emerald-100 text-emerald-600',
            badge: 'bg-emerald-600',
            ring: 'focus:ring-emerald-400',
            border: 'border-emerald-200',
            uploadHover: 'hover:border-emerald-400 hover:bg-emerald-50',
        },
    };
    const c = colorMap[color] || colorMap.blue;

    const handleDownload = async () => {
        setDownloading(true);
        try {
            await onDownload();
        } catch (err) {
            setResult({ type: 'error', message: err.message || 'Download failed' });
        } finally {
            setDownloading(false);
        }
    };

    const handleFileChange = (e) => {
        const f = e.target.files?.[0];
        setFile(f || null);
        setResult(null);
    };

    const handleRestore = async () => {
        if (!file) return;
        setRestoring(true);
        setResult(null);
        try {
            const formData = new FormData();
            formData.append('backup', file);
            const res = await onRestore(formData);
            setResult({ type: 'success', ...res });
            setFile(null);
            if (fileRef.current) fileRef.current.value = '';
        } catch (err) {
            setResult({ type: 'error', message: err.message || 'Restore failed' });
        } finally {
            setRestoring(false);
        }
    };

    const clearFile = () => {
        setFile(null);
        setResult(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    return (
        <div className="bg-white rounded-[28px] shadow-[0_18px_40px_rgba(15,23,42,0.06)] p-7 flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${c.icon}`}>
                    <Icon className="h-6 w-6" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
                    <p className="text-sm text-slate-400">{description}</p>
                </div>
            </div>

            {/* Download section */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <p className="text-sm font-medium text-slate-700">Export backup</p>
                        <p className="text-xs text-slate-400 mt-0.5">Downloads a JSON file with all records up to today</p>
                    </div>
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0f0f10] text-white text-sm font-semibold hover:bg-slate-800 transition disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
                    >
                        {downloading
                            ? <><Loader2 className="h-4 w-4 animate-spin" /> Exporting…</>
                            : <><Download className="h-4 w-4" /> Download Backup</>
                        }
                    </button>
                </div>
            </div>

            {/* Restore section */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 flex flex-col gap-4">
                <div>
                    <p className="text-sm font-medium text-slate-700">Restore from backup</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Upload a previously downloaded JSON backup. Records already in the database are skipped automatically.
                    </p>
                </div>

                {/* Drop zone / file picker */}
                <div
                    onClick={() => fileRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl py-8 cursor-pointer transition ${c.uploadHover}`}
                >
                    <FileJson className="h-8 w-8 text-slate-300" />
                    {file
                        ? <p className="text-sm font-medium text-slate-700">{file.name}</p>
                        : <p className="text-sm text-slate-400">Click to choose a JSON backup file</p>
                    }
                    <p className="text-xs text-slate-300">Max 50 MB</p>
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".json,application/json"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>

                {file && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRestore}
                            disabled={restoring}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {restoring
                                ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing…</>
                                : <><Upload className="h-4 w-4" /> Import Records</>
                            }
                        </button>
                        <button
                            onClick={clearFile}
                            disabled={restoring}
                            title="Clear selection"
                            className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </button>
                    </div>
                )}

                <ResultBanner result={result} onDismiss={() => setResult(null)} />
            </div>
        </div>
    );
};

// ── Page ──────────────────────────────────────────────────────────────────────

const Backup = () => {
    return (
        <div className="min-h-full px-10 py-8 space-y-8">
            <div>
                <h1 className="text-2xl font-semibold text-slate-900">Backup & Restore</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Export a full JSON backup of your invoices and quotations, or restore records from a previous backup.
                </p>
            </div>

            {/* Info callout */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 text-sm text-blue-700">
                <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-medium">Safe imports</p>
                    <p className="text-blue-500 mt-0.5">
                        Records with an invoice/quotation number that already exists in the database are automatically skipped — no duplicates will be created.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BackupPanel
                    title="Invoices"
                    description="All invoice records including items, totals, client snapshots, and payment details"
                    icon={Receipt}
                    color="blue"
                    onDownload={() => api.backup.downloadInvoices()}
                    onRestore={(fd) => api.backup.restoreInvoices(fd)}
                />

                <BackupPanel
                    title="Quotations"
                    description="All quotation records including items, terms, status history, and work order references"
                    icon={FileText}
                    color="emerald"
                    onDownload={() => api.backup.downloadQuotations()}
                    onRestore={(fd) => api.backup.restoreQuotations(fd)}
                />
            </div>
        </div>
    );
};

export default Backup;
