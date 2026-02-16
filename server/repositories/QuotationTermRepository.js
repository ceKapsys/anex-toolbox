const BaseRepository = require('./BaseRepository');
const prisma = require('../lib/prisma');

class QuotationTermRepository extends BaseRepository {
    constructor() {
        super(prisma.quotationTerm);
    }
}

module.exports = new QuotationTermRepository();
