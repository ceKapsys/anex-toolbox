const BaseRepository = require('./BaseRepository');
const prisma = require('../lib/prisma');

class QuotationRepository extends BaseRepository {
    constructor() {
        super(prisma.quotation);
    }

    // Add specific quotation methods here if needed
}

module.exports = new QuotationRepository();
