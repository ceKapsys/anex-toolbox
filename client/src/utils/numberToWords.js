/**
 * Convert number to words (Indian Numbering System for Bangladesh)
 * e.g. 123456 -> One Lakh Twenty Three Thousand Four Hundred Fifty Six
 */
export const numberToWords = (n) => {
    n = Math.floor(n);
    if (n <= 0) return 'Zero';

    const one = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const ten = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convert = (num) => {
        if (num < 20) return one[num];
        if (num < 100) return ten[Math.floor(num / 10)] + (num % 10 ? ' ' + one[num % 10] : '');
        return one[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + convert(num % 100) : '');
    };

    let parts = [];
    if (n >= 10000000) { parts.push(convert(Math.floor(n / 10000000)) + ' Crore'); n %= 10000000; }
    if (n >= 100000) { parts.push(convert(Math.floor(n / 100000)) + ' Lakh'); n %= 100000; }
    if (n >= 1000) { parts.push(convert(Math.floor(n / 1000)) + ' Thousand'); n %= 1000; }
    if (n > 0) parts.push(convert(n));

    return parts.join(' ');
};
