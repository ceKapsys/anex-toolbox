const BaseRepository = require('./BaseRepository');
const prisma = require('../lib/prisma');

class AuthRepository extends BaseRepository {
    constructor() {
        super(prisma.adminUser);
        this.sessionModel = prisma.session;
    }

    async findByUsername(username) {
        return await this.model.findUnique({
            where: { username: username },
        });
    }

    async createSession(data) {
        return await this.sessionModel.create({
            data,
        });
    }

    async findSessionById(sessionId) {
        return await this.sessionModel.findUnique({
            where: { id: sessionId },
            include: { user: true },
        });
    }

    async deleteSession(sessionId) {
        return await this.sessionModel.delete({
            where: { id: sessionId },
        });
    }

    async deleteExpiredSessions() {
        return await this.sessionModel.deleteMany({
            where: {
                expires_at: {
                    lt: new Date(),
                },
            },
        });
    }
}

module.exports = new AuthRepository();
