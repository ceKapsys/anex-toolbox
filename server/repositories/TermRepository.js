const BaseRepository = require('./BaseRepository');
const prisma = require('../lib/prisma');

class TermRepository extends BaseRepository {
    constructor() {
        super(prisma.term);
        this.quotationTermModel = prisma.quotationTerm;
    }

    async findAllInvoiceTerms() {
        return await this.model.findMany({
            where: { type: 'invoice' },
        });
    }

    async findAllQuotationTerms() {
        return await this.quotationTermModel.findMany();
    }

    // Override create to support type for invoices
    async createInternal(data) {
        return await this.model.create({ data });
    }

    async createQuotationTerm(data) {
        return await this.quotationTermModel.create({ data });
    }
}

module.exports = new TermRepository();
