const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('anex.db');

db.all('SELECT * FROM quotations WHERE status = "Draft" ORDER BY created_at DESC', (err, rows) => {
    if (err) {
        console.error('Error:', err.message);
    } else {
        console.log('Draft Quotations:');
        console.log(JSON.stringify(rows, null, 2));
    }
    db.close();
});
