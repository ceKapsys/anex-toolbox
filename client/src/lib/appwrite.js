import { Client, Databases, Storage } from 'appwrite';

export const client = new Client();

client
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT);

export const databases = new Databases(client);
export const storage = new Storage(client);

export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
export const COLLECTIONS = {
    SETTINGS: 'settings',
    CLIENTS: 'clients',
    INVOICES: 'invoices',
    QUOTATIONS: 'quotations',
};

export const BUCKETS = {
    IMAGES: 'images'
};
