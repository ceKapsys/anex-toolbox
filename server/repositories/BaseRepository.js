class BaseRepository {
    constructor(model) {
        this.model = model;
    }

    async findAll(args = {}) {
        return await this.model.findMany(args);
    }

    async findById(id) {
        return await this.model.findUnique({
            where: { id: parseInt(id) },
        });
    }

    async create(data) {
        return await this.model.create({
            data,
        });
    }

    async update(id, data) {
        return await this.model.update({
            where: { id: parseInt(id) },
            data,
        });
    }

    async delete(id) {
        return await this.model.delete({
            where: { id: parseInt(id) },
        });
    }
}

module.exports = BaseRepository;
