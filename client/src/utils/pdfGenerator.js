/**
 * PDF Generator Utility
 * Uses html2pdf.js to convert React components to PDF
 * Optimized for exact preview matching
 */
import html2pdf from 'html2pdf.js';

/**
 * Generates a PDF from the provided HTML element
 * @param {HTMLElement} element - The DOM element to convert to PDF
 * @param {string} filename - The desired filename for the download
 */
export const generatePDF = (element, filename = 'document.pdf') => {
    // Options optimized for high-fidelity output
    const opt = {
        margin: [0, 0, 0, 0], // No additional margin, we control it in CSS @page
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            scrollX: 0,
            scrollY: 0,
            windowWidth: 794,
            onclone: (doc) => {
                // Force sRGB color space to avoid OKLCH issues
                const colorStyle = doc.createElement('style');
                colorStyle.innerHTML = '* { color-interpolation: sRGB !important; }';
                doc.head.appendChild(colorStyle);

                // Inject aggressive element reset to remove all browser default margins
                const resetStyle = doc.createElement('style');
                resetStyle.innerHTML = `
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    h1, h2, h3, h4, h5, h6,
                    p, ul, ol, li,
                    blockquote, pre, hr,
                    figure, figcaption,
                    dl, dd, dt {
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    ul, ol {
                        padding-left: 18px !important;
                    }
                    table {
                        border-collapse: collapse !important;
                    }
                `;
                doc.head.appendChild(resetStyle);
            }
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
        },
        pagebreak: {
            mode: ['avoid-all'],
            before: [],
            after: [],
            avoid: '.anex-page, .quotation-page'
        }
    };

    // Execute generation
    console.log('Starting html2pdf generation for:', filename);
    html2pdf().set(opt).from(element).save().then(() => {
        console.log('PDF Generation successful');
    }).catch(err => {
        console.error('PDF Generation failed:', err);
    });
};
