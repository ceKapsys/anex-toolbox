const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const prismaClientSingleton = () => {
    if (!process.env.DATABASE_URL) {
        console.error('ERROR: DATABASE_URL is missing in environment variables!');
        throw new Error('DATABASE_URL is missing');
    }
    console.log('Initializing Prisma Client with Adapter...');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
};

const globalForPrisma = global;

const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

module.exports = prisma;
