const BaseRepository = require('./BaseRepository');
const prisma = require('../lib/prisma');

class ServiceRepository extends BaseRepository {
    constructor() {
        super(prisma.service);
    }
}

module.exports = new ServiceRepository();
