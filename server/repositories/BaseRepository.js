class BaseRepository {
    constructor(model) {
        this.model = model;
    }

    /**
     * Safely parse an ID to integer, throwing if invalid.
     */
    _parseId(id) {
        const parsed = parseInt(id, 10);
        if (isNaN(parsed)) {
            throw new Error('Invalid ID format');
        }
        return parsed;
    }

    async findAll(args = {}) {
        return await this.model.findMany(args);
    }

    async findById(id) {
        return await this.model.findUnique({
            where: { id: this._parseId(id) },
        });
    }

    async create(data) {
        return await this.model.create({
            data,
        });
    }

    async update(id, data) {
        return await this.model.update({
            where: { id: this._parseId(id) },
            data,
        });
    }

    async delete(id) {
        return await this.model.delete({
            where: { id: this._parseId(id) },
        });
    }
}

module.exports = BaseRepository;
