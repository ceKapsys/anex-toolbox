const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('anex.db');

db.all('SELECT id, quotation_number, status, date, to_company, total FROM quotations ORDER BY created_at DESC', (err, rows) => {
    if (err) {
        console.error('Error:', err.message);
    } else {
        console.log('All Quotations:');
        console.log(JSON.stringify(rows, null, 2));
    }
    db.close();
});
