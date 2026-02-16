const BaseRepository = require('./BaseRepository');
const prisma = require('../lib/prisma');

class ClientRepository extends BaseRepository {
    constructor() {
        super(prisma.client);
    }

    async findByName(name) {
        return await this.model.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: 'insensitive', // Case-insensitive search
                },
            },
        });
    }

    async findByCode(code) {
        return await this.model.findUnique({
            where: { client_code: code },
        });
    }

    // Generate unique client code logic port
    async generateClientCode(name) {
        const firstLetter = (name || 'X').charAt(0).toUpperCase();
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars: I, O, 0, 1

        const generateCode = () => {
            let code = firstLetter;
            for (let i = 0; i < 5; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return code;
        };

        const tryGenerate = async (attempts = 0) => {
            if (attempts > 10) {
                throw new Error('Failed to generate unique client code');
            }

            const clientCode = generateCode();
            const existing = await this.findByCode(clientCode);

            if (existing) {
                return await tryGenerate(attempts + 1);
            }

            return clientCode;
        };

        return await tryGenerate();
    }
}

module.exports = new ClientRepository();
