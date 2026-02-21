import React, { useRef, useState } from 'react';
import { Eye, Download, Loader2 } from 'lucide-react';
import InvoiceTemplate from '../templates/InvoiceTemplate';
import { downloadInvoicePDF } from '../../utils/invoicePdfMake';

const InvoicePreview = ({ data }) => {
    const [generating, setGenerating] = useState(false);

    const handleDownload = async () => {
        setGenerating(true);
        try {
            await downloadInvoicePDF(data, `${data.invoice_no || 'invoice'}.pdf`);
        } catch (err) {
            console.error('PDF generation failed:', err);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="w-1/2 flex flex-col rounded-[28px] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)] overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-slate-400" /> Preview
                </h2>
                <button
                    onClick={handleDownload}
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
            <div className="flex-1 overflow-auto p-8 bg-[#f6f3f1] flex justify-center">
                <div className="origin-top transform scale-[0.65] shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                    <InvoiceTemplate data={data} />
                </div>
            </div>
        </div>
    );
};

export default InvoicePreview;
