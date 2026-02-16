import { defineConfig } from '@prisma/config';

export default defineConfig({
    datasources: [
        {
            provider: 'postgresql',
            url: process.env.DATABASE_URL,
        },
    ],
});
