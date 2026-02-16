const BaseRepository = require('./BaseRepository');
const prisma = require('../lib/prisma');

class InvoiceRepository extends BaseRepository {
    constructor() {
        super(prisma.invoice);
    }

    // Add specific invoice methods here if needed
}

module.exports = new InvoiceRepository();
