import React from 'react';
import '../../assets/css/invoice-print.css';

/**
 * InvoiceTemplate Component
 * 
 * Renders the exact HTML structure required for the invoice PDF (Mushak 6.3 compliant).
 */
const InvoiceTemplate = React.forwardRef(({ data }, ref) => {
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
                    <div className="gov-text">National Board of Revenue (Tax Invoice)</div>
                    <div className="tag-box">TAX INVOICE</div>
                </div>
                <div className="right-tag">
                    <div className="tag-box">MUSHAK 6.3</div>
                </div>
            </div>

            <div className="section">
                <div className="section-head">Registered Business Info</div>
                <div className="section-body" style={{ textAlign: 'center' }}>
                    <div><span className="label">Business Name:</span> <span className="val">{company_details?.name}</span></div>
                    <div><span className="label">BIN Number:</span> <span className="val">{company_details?.bin}</span></div>
                    <div><span className="label">Address:</span> <span className="val">{company_details?.address}</span></div>
                </div>
            </div>

            <div className="anex-row">
                <div className="section" style={{ flex: 1 }}>
                    <div className="section-head">Buyer Information</div>
                    <div className="section-body">
                        <div className="info-grid">
                            <div className="label">Buyer Name</div><div className="sep">:</div><div className="val">{client?.name}</div>
                            <div className="label">Buyer BIN</div><div className="sep">:</div><div className="val">{client?.bin}</div>
                            <div className="label">Buyer Address</div><div className="sep">:</div><div className="val">{client?.address}</div>
                        </div>
                    </div>
                </div>
                <div className="section" style={{ flex: 1 }}>
                    <div className="section-head">Invoice Information</div>
                    <div className="section-body">
                        <div className="info-grid">
                            <div className="label">Invoice Number</div><div className="sep">:</div><div className="val">{invoice_no}</div>
                            <div className="label">Invoice Issue Date</div><div className="sep">:</div><div className="val">{issue_date}</div>
                            <div className="label">Invoice Due Date</div><div className="sep">:</div><div className="val">{due_date}</div>
                            {time_f && <><div className="label">Timestamp</div><div className="sep">:</div><div className="val">{time_f}</div></>}
                            {quote_ref && <><div className="label">Quotation Ref</div><div className="sep">:</div><div className="val">{quote_ref}</div></>}
                            {work_order_ref && <><div className="label">Work Order Ref</div><div className="sep">:</div><div className="val">{work_order_ref}</div></>}
                            {approved_by && <><div className="label">Approved By</div><div className="sep">:</div><div className="val">{approved_by}</div></>}
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

                <div className="math-row">
                    <div className="math-box"><div className="math-head">Net Amount</div><div>{fmt(total_ex_vat)}</div></div>
                    <div>+</div>
                    <div className="math-box"><div className="math-head">VAT Amount</div><div>{fmt(total_vat)}</div></div>
                    <div>-</div>
                    <div className="math-box"><div className="math-head">Adjustment</div><div>{adjust_amount ? fmt(adjust_amount) : '-'}</div></div>
                    <div>=</div>
                    <div className="math-box"><div className="math-head">Due Amount</div><div>{fmt(due_amount)}</div></div>
                </div>

                {adjust_note && <div className="adjustment-note"><strong>Adjustment Note:</strong> {adjust_note}</div>}

                <div className="pay-bar">Please pay BDT {fmt(due_amount)}</div>
            </div>

            <div className="content-section">
                <div className="terms">
                    <h3>Terms & Conditions</h3>
                    <div style={{ whiteSpace: 'pre-line' }}>{terms}</div>
                </div>
            </div>

            <div className="content-section">
                <div className="payment-card">
                    <div className="payment-head">Payment Method</div>
                    <div className="payment-body">
                        <div className="bank-logo">
                            {bank_details?.logo ? (
                                <img src={bank_details.logo} alt="Bank" />
                            ) : (
                                <div className="bank-logo text">{bank_details?.bank?.substring(0, 3).toUpperCase()}</div>
                            )}
                        </div>
                        <div className="bank-details">
                            <div className="bank-row">
                                <div className="bank-label">Bank<span className="bank-sep">:</span></div>
                                <div className="bank-val">{bank_details?.bank}</div>
                                <div className="bank-sep">|</div>
                                <div className="bank-label">A/C Name<span className="bank-sep">:</span></div>
                                <div className="bank-val">{bank_details?.ac_name}</div>
                            </div>
                            <div className="bank-row">
                                <div className="bank-label">A/C No.<span className="bank-sep">:</span></div>
                                <div className="bank-val">{bank_details?.ac_no}</div>
                                <div className="bank-sep">|</div>
                                <div className="bank-label">Routing<span className="bank-sep">:</span></div>
                                <div className="bank-val">{bank_details?.routing}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="foot-note">
                {disclaimer && <div>{disclaimer}</div>}
                <div>For any issues please contact <span style={{ color: '#2563eb', fontWeight: 700 }}>finance@anexbusiness.com</span></div>
            </div>
        </div>
    );
});

export default InvoiceTemplate;
