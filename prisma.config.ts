import { defineConfig } from '@prisma/config';

export default defineConfig({
    earlyAccess: true,
    datasource: {
        // Ensure pgbouncer=true is present for Supabase Transaction pooler
        url: process.env.DATABASE_URL?.includes('pgbouncer')
            ? process.env.DATABASE_URL
            : `${process.env.DATABASE_URL}?pgbouncer=true`,
    },
});
