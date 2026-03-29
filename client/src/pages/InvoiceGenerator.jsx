import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useInvoice } from '../hooks/useInvoice';
import InvoiceEditor from '../components/invoice/InvoiceEditor';
import InvoicePreview from '../components/invoice/InvoicePreview';

const InvoiceGenerator = () => {
    const { id: routeInvoiceId } = useParams();
    const [searchParams] = useSearchParams();
    const invoiceId = routeInvoiceId || searchParams.get('id');

    const {
        data, clients, services, terms, banks, saving,
        updateField, updateClient, updateItem, addItem, removeItem, saveInvoice
    } = useInvoice(invoiceId);

    return (
        <div className="space-y-4">
            <div className="px-6">
                <Link to="/invoices" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
                    <ArrowLeft className="w-4 h-4" /> Back to Invoices
                </Link>
            </div>
            <div className="flex h-[calc(100vh-180px)] gap-8">
                <InvoiceEditor
                    data={data}
                    clients={clients}
                    services={services}
                    terms={terms}
                    banks={banks}
                    saving={saving}
                    updateField={updateField}
                    updateClient={updateClient}
                    updateItem={updateItem}
                    addItem={addItem}
                    removeItem={removeItem}
                    saveInvoice={saveInvoice}
                />
                <InvoicePreview data={data} />
            </div>
        </div>
    );
};

export default InvoiceGenerator;
