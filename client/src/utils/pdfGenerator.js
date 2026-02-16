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
            scale: 2, // Higher scale for better text quality
            useCORS: true, // Enable cross-origin images (logos)
            logging: false, // Reduce console noise
            scrollY: 0, // Prevent scroll offset issues
            // Standard A4 width at 96 DPI is approx 794px. 
            // We set windowWidth slightly larger or exact to ensure styles don't break.
            windowWidth: 794,
            onclone: (doc) => {
                // Force sRGB color space to avoid OKLCH issues if possible
                const style = doc.createElement('style');
                style.innerHTML = '* { color-interpolation: sRGB !important; }';
                doc.head.appendChild(style);
            }
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
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
