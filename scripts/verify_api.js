const http = require('http');

const get = (path) => {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:5000/api${path}`, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
};

const run = async () => {
    try {
        console.log('Testing GET /invoices...');
        const invoices = await get('/invoices');
        console.log('Invoices type:', Array.isArray(invoices) ? 'Array' : typeof invoices);
        console.log('Invoices count:', invoices.length);
        if (invoices.length > 0) {
            console.log('Sample invoice:', JSON.stringify(invoices[0]).substring(0, 100) + '...');
        }

        console.log('\nTesting GET /settings...');
        const settings = await get('/settings');
        console.log('Settings type:', Array.isArray(settings) ? 'Array' : typeof settings);
        console.log('Keys:', Object.keys(settings));

    } catch (err) {
        console.error('Error:', err.message);
    }
};

run();
