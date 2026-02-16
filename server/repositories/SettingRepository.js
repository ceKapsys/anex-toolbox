const BaseRepository = require('./BaseRepository');
const prisma = require('../lib/prisma');

class SettingRepository extends BaseRepository {
    constructor() {
        super(prisma.setting);
    }

    // Settings are key-value pairs, so findById is practically findByKey
    async findByKey(key) {
        return await this.model.findUnique({
            where: { key: key },
        });
    }

    // Override findAll to return an object map potentially, or keep list
    // Existing logic likely expects key-value pairs
    async getAllSettings() {
        const settings = await this.findAll();
        // Convert to object { key: value } if that matches existing usage pattern
        // But for repository pattern, returning the list is safer, let controller handle transformation
        return settings;
    }

    async upsert(key, value) {
        return await this.model.upsert({
            where: { key: key },
            update: { value: value },
            create: { key: key, value: value },
        });
    }
}

module.exports = new SettingRepository();
