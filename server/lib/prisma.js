const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const prismaClientSingleton = () => {
    if (!process.env.DATABASE_URL) {
        console.error('ERROR: DATABASE_URL is missing in environment variables!');
        throw new Error('DATABASE_URL is missing');
    }

    console.log('Initializing Prisma Client with Adapter...');

    let connectionString = process.env.DATABASE_URL;

    // Ensure '#' in password is URL-encoded as %23
    // Vercel may store the raw password with '#', but pg's Pool uses new URL()
    // internally which treats '#' as a URL fragment separator, breaking parsing
    connectionString = connectionString.replace(
        /^(postgresql:\/\/[^:]+:)([^@]+)(@.+)$/,
        (match, prefix, password, suffix) => {
            // Only re-encode if the password contains an unencoded '#'
            if (password.includes('#')) {
                password = password.replace(/#/g, '%23');
            }
            return prefix + password + suffix;
        }
    );

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
};

const globalForPrisma = global;

const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

module.exports = prisma;
