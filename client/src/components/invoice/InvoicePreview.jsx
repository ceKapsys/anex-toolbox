import React, { useRef } from 'react';
import { Eye, Download } from 'lucide-react';
import InvoiceTemplate from '../templates/InvoiceTemplate';
import { generatePDF } from '../../utils/pdfGenerator';

const InvoicePreview = ({ data }) => {
    const pdfRef = useRef();

    const downloadPDF = () => {
        generatePDF(pdfRef.current, `${data.invoice_no}.pdf`);
    };

    return (
        <div className="w-1/2 flex flex-col rounded-[28px] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)] overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-slate-400" /> Preview
                </h2>
                <button onClick={downloadPDF} className="bg-[#0f0f10] hover:bg-black text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition">
                    <Download className="w-4 h-4" /> Download PDF
                </button>
            </div>
            <div className="flex-1 overflow-auto p-8 bg-[#f6f3f1] flex justify-center">
                <div className="origin-top transform scale-[0.65] shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                    <InvoiceTemplate data={data} />
                </div>
            </div>
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: '-10000px',
                    visibility: 'hidden',
                    pointerEvents: 'none'
                }}
            >
                <InvoiceTemplate ref={pdfRef} data={data} />
            </div>
        </div>
    );
};

export default InvoicePreview;
