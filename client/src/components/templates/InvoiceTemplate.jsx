import React from 'react';
import '../../assets/css/invoice-print.css';

/**
 * InvoiceTemplate Component
 * 
 * Renders the exact HTML structure required for the invoice PDF (Mushak 6.3 compliant).
 */
const InvoiceTemplate = React.forwardRef(({ data }, ref) => {
    console.log('InvoiceTemplate Rendering:', { data, ref });
    if (!data) return null;

    const {
        company_details,
        company_logo,
        client,
        invoice_no,
        issue_date,
        due_date,
        time_f,
        quote_ref,
        work_order_ref,
        approved_by,
        items,
        total_qty,
        total_ex_vat,
        total_sd,
        total_vat,
        due_amount,
        adjust_amount,
        adjust_note,
        amount_in_words,
        terms,
        bank_details,
        disclaimer
    } = data;

    // Helper for formatting doubles
    const fmt = (n) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Number(n) || 0);
    };

    return (
        <div className="anex-page" ref={ref}>
            <div className="header-grid">
                <div className="logo-box">
                    {company_logo && <img src={company_logo} alt="Company Logo" />}
                </div>
                <div className="center-stack">
                    <div className="gov-text">Government of the People's Republic of Bangladesh</div>
                    <div className="gov-text">National Board of Revenue (NBR)</div>
                    <div className="tag-box">TAX INVOICE</div>
                </div>
                <div className="right-tag">
                    <div className="tag-box">MUSHAK 6.3</div>
                </div>
            </div>

            <div className="section">
                <div className="section-head">Registered Business Info</div>
                <div className="section-body text-center">
                    <div><span className="label">Business Name:</span> <span className="val">{company_details?.name}</span></div>
                    <div><span className="label">BIN Number:</span> <span className="val">{company_details?.bin}</span></div>
                    <div><span className="label">Address:</span> <span className="val">{company_details?.address}</span></div>
                </div>
            </div>

            <div className="anex-row">
                <div className="col-left">
                    <div className="section">
                        <div className="section-head">Buyer Information</div>
                        <div className="section-body">
                            <table className="info-table">
                                <tbody>
                                    <tr><td className="info-label-cell">Buyer Name</td><td className="info-sep-cell">:</td><td className="info-val-cell">{client?.name}</td></tr>
                                    <tr><td className="info-label-cell">Buyer BIN</td><td className="info-sep-cell">:</td><td className="info-val-cell">{client?.bin}</td></tr>
                                    <tr><td className="info-label-cell">Buyer Address</td><td className="info-sep-cell">:</td><td className="info-val-cell">{client?.address}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="col-right">
                    <div className="section">
                        <div className="section-head">Invoice Information</div>
                        <div className="section-body">
                            <table className="info-table">
                                <tbody>
                                    <tr><td className="info-label-cell">Invoice Number</td><td className="info-sep-cell">:</td><td className="info-val-cell">{invoice_no}</td></tr>
                                    <tr><td className="info-label-cell">Invoice Issue Date</td><td className="info-sep-cell">:</td><td className="info-val-cell">{issue_date}</td></tr>
                                    <tr><td className="info-label-cell">Invoice Due Date</td><td className="info-sep-cell">:</td><td className="info-val-cell">{due_date}</td></tr>
                                    {time_f && <tr><td className="info-label-cell">Timestamp</td><td className="info-sep-cell">:</td><td className="info-val-cell">{time_f}</td></tr>}
                                    {quote_ref && <tr><td className="info-label-cell">Quotation Ref</td><td className="info-sep-cell">:</td><td className="info-val-cell">{quote_ref}</td></tr>}
                                    {work_order_ref && <tr><td className="info-label-cell">Work Order Ref</td><td className="info-sep-cell">:</td><td className="info-val-cell">{work_order_ref}</td></tr>}
                                    {approved_by && <tr><td className="info-label-cell">Approved By</td><td className="info-sep-cell">:</td><td className="info-val-cell">{approved_by}</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div className="content-section table-wrap">
                <table className="inv-table">
                    <thead>
                        <tr className="num-row"><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th><th>9</th><th>10</th><th>11</th></tr>
                        <tr className="hdr-row">
                            <th>SL No.</th><th>Description</th><th>Unit of Supply</th><th>Qty</th><th>Per Unit Price</th><th>Total Price</th>
                            <th>SD Rate</th><th>SD Amount</th><th>VAT Rate</th><th>VAT Amount</th><th>Total Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items && items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="cell center">{idx + 1}</td>
                                <td className="cell text">{item.desc || item.title}</td>
                                <td className="cell center">{item.unit}</td>
                                <td className="cell center">{item.qty}</td>
                                <td className="cell right">{fmt(item.price)}</td>
                                <td className="cell right">{fmt(item.base_total)}</td>
                                <td className="cell center">{item.sd > 0 ? `${item.sd}%` : '-'}</td>
                                <td className="cell right">{item.sd > 0 ? fmt(item.sd_amount) : '-'}</td>
                                <td className="cell center">{item.vat}%</td>
                                <td className="cell right">{fmt(item.vat_amount)}</td>
                                <td className="cell right bold">{fmt(item.line_total)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="hdr-row">
                            <td className="cell right bold" colSpan="3">Total</td>
                            <td className="cell center bold">{fmt(total_qty)}</td>
                            <td className="cell"></td>
                            <td className="cell right bold">{fmt(total_ex_vat)}</td>
                            <td className="cell center"></td>
                            <td className="cell right bold">{fmt(total_sd)}</td>
                            <td className="cell center"></td>
                            <td className="cell right bold">{fmt(total_vat)}</td>
                            <td className="cell right bold">{fmt(due_amount + (adjust_amount || 0))}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="content-section">
                <div className="words">Total in Words: {amount_in_words} Taka Only</div>

                <div className="math-container">
                    <div className="math-row">
                        <div className="math-item">
                            <div className="math-box"><div className="math-head">Net Amount</div><div className="math-val">{fmt(total_ex_vat)}</div></div>
                        </div>
                        <div className="math-item math-op">+</div>
                        <div className="math-item">
                            <div className="math-box"><div className="math-head">VAT Amount</div><div className="math-val">{fmt(total_vat)}</div></div>
                        </div>
                        <div className="math-item math-op">-</div>
                        <div className="math-item">
                            <div className="math-box"><div className="math-head">Adjustment</div><div className="math-val">{adjust_amount ? fmt(adjust_amount) : '-'}</div></div>
                        </div>
                        <div className="math-item math-op">=</div>
                        <div className="math-item">
                            <div className="math-box"><div className="math-head">Due Amount</div><div className="math-val">{fmt(due_amount)}</div></div>
                        </div>
                    </div>
                </div>

                {adjust_note && <div className="adjustment-note"><strong>Adjustment Note:</strong> {adjust_note}</div>}

                <div className="pay-bar">Please pay BDT {fmt(due_amount)}</div>
            </div>

            <div className="content-section">
                <div className="terms">
                    <h3>Terms & Conditions</h3>
                    {data.terms_text ? (
                        <ul className="terms-list-ul">
                            {data.terms_text.split('\n').filter(line => line.trim()).map((line, idx) => (
                                <li key={idx}>{line.trim().replace(/^[-•*]\s*/, '')}</li>
                            ))}
                        </ul>
                    ) : (
                        <div className="terms-text-container">{terms}</div>
                    )}
                </div>
            </div>

            <div className="content-section">
                <div className="payment-section">
                    <div className="payment-head">Payment Method</div>
                    <div className="payment-body">
                        <div className="bank-left">
                            <div className="bank-logo-box">
                                {bank_details?.logo ? (
                                    <img src={bank_details.logo} alt="Bank" />
                                ) : (
                                    <div className="bank-logo-text">{bank_details?.bank?.substring(0, 3).toUpperCase()}</div>
                                )}
                            </div>
                        </div>
                        <div className="bank-right">
                            <div className="bank-info-line">
                                <span className="bank-label">Bank Name:</span>
                                <span className="bank-val">{bank_details?.bank}</span>
                                <span className="bank-pipe">|</span>
                                <span className="bank-label">A/C Name:</span>
                                <span className="bank-val">{bank_details?.ac_name}</span>
                            </div>
                            <div className="bank-info-line">
                                <span className="bank-label">A/C No:</span>
                                <span className="bank-val">{bank_details?.ac_no}</span>
                                <span className="bank-pipe">|</span>
                                <span className="bank-label">Routing:</span>
                                <span className="bank-val">{bank_details?.routing}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="foot-note">
                {disclaimer && <div>{disclaimer}</div>}
                <div>For any issues please contact <span className="contact-email-link">finance@anexbusiness.com</span></div>
            </div>
        </div>
    );
});

export default InvoiceTemplate;
