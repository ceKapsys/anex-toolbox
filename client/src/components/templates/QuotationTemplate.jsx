import React from 'react';
import '../../assets/css/quotation-print.css';

/**
 * QuotationTemplate Component
 * 
 * Renders the exact HTML structure required for the quotation PDF.
 * This component is intended to be hidden or shown in a preview modal,
 * and passed to html2pdf.js for generation.
 */
const QuotationTemplate = React.forwardRef(({ data }, ref) => {
    if (!data) return null;

    const {
        quotation_number,
        quotation_date,
        valid_till_date,
        client,
        header_image,
        footer_image,
        items,
        vat_percentage,
        subtotal,
        vat_amount,
        grand_total,
        terms_conditions,
        contact_details,
        disclaimer
    } = data;

    // Helper to format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount || 0);
    };

    // Helper to render terms list
    const renderTerms = (terms) => {
        if (!terms) return null;
        // If it already contains HTML, render dangerously (be careful)
        // For now, assume it's a plain string or new-line separated
        const lines = terms.split('\n').filter(line => line.trim() !== '');
        return (
            <ul className="terms-list">
                {lines.map((line, index) => (
                    <li key={index}>{line}</li>
                ))}
            </ul>
        );
    };

    return (
        <div className="quotation-page" ref={ref}>
            {/* Global Header */}
            <header className="quotation-header">
                {header_image && (
                    <img src={header_image} alt="Header" className="header-image" />
                )}
                <h1 className="quotation-title">QUOTATION</h1>
            </header>

            {/* Main Content */}
            <main className="quotation-content">

                {/* Quotation Info Section */}
                <section className="quotation-info-box">
                    {/* Left Column: Client Info */}
                    <div className="info-column">
                        <div className="info-label-header">QUOTATION TO</div>
                        <div className="client-name">{client.name}</div>
                        <div className="client-address" style={{ whiteSpace: 'pre-line' }}>{client.address}</div>
                        {client.attention && (
                            <div className="client-attention">
                                <span className="attention-label">Attn:</span>
                                <span>{client.attention}</span>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Reference Info */}
                    <div className="info-column">
                        <div className="info-row">
                            <span className="info-label">Number</span>
                            <span className="info-colon">:</span>
                            <span className="info-value">{quotation_number}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Date</span>
                            <span className="info-colon">:</span>
                            <span className="info-value">{quotation_date}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Validity</span>
                            <span className="info-colon">:</span>
                            <span className="info-value">{valid_till_date}</span>
                        </div>
                    </div>
                </section>

                {/* Items Table */}
                <section className="quotation-items">
                    <table className="items-table">
                        <thead>
                            <tr>
                                <th className="col-sl">SL</th>
                                <th className="col-item">Item</th>
                                <th className="col-qty">Qty</th>
                                <th className="col-unit">Unit</th>
                                <th className="col-price">Price</th>
                                <th className="col-total">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={index}>
                                    <td className="cell-center">{String(index + 1).padStart(2, '0')}</td>
                                    <td className="cell-item">
                                        <div className="item-title">{item.title}</div>
                                        {item.description && (
                                            <div className="item-description">{item.description}</div>
                                        )}
                                    </td>
                                    <td className="cell-center">{item.qty}</td>
                                    <td className="cell-center">{item.unit}</td>
                                    <td className="cell-right">{formatCurrency(item.price)}</td>
                                    <td className="cell-right">{formatCurrency(item.line_total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* Financial Summary */}
                <section className="financial-summary">
                    <table className="summary-table">
                        <tbody>
                            <tr className="summary-row">
                                <td className="summary-label">Subtotal</td>
                                <td className="summary-value">{formatCurrency(subtotal)}</td>
                            </tr>
                            <tr className="summary-row">
                                <td className="summary-label">VAT ({vat_percentage}%)</td>
                                <td className="summary-value">{formatCurrency(vat_amount)}</td>
                            </tr>
                            <tr className="summary-row summary-total">
                                <td className="summary-label">Total</td>
                                <td className="summary-value">{formatCurrency(grand_total)} BDT</td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                {/* Footer Grid */}
                <section className="footer-grid">
                    {/* Terms & Conditions */}
                    <div className="footer-box">
                        <h3 className="footer-box-title">Terms & Conditions</h3>
                        <div className="footer-box-content">
                            {renderTerms(terms_conditions)}
                        </div>
                    </div>

                    {/* Contact Details */}
                    {contact_details && contact_details.name && (
                        <div className="footer-box">
                            <h3 className="footer-box-title">Contact Details</h3>
                            <div className="footer-box-content">
                                <div className="contact-name">{contact_details.name}</div>
                                {contact_details.designation && (
                                    <div className="contact-designation">{contact_details.designation}</div>
                                )}
                                {contact_details.phone && (
                                    <div className="contact-info">Phone: {contact_details.phone}</div>
                                )}
                                {contact_details.email && (
                                    <div className="contact-info">Email: {contact_details.email}</div>
                                )}
                            </div>
                        </div>
                    )}
                </section>

            </main>

            {/* Global Footer */}
            <footer className="quotation-footer">
                {disclaimer && (
                    <div className="disclaimer">{disclaimer}</div>
                )}
                {footer_image && (
                    <img src={footer_image} alt="Footer" className="footer-image" />
                )}
            </footer>
        </div>
    );
});

export default QuotationTemplate;
