import { Client, Databases, Storage } from 'appwrite';

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
const project = import.meta.env.VITE_APPWRITE_PROJECT;

if (!endpoint || !project) {
    console.error('Appwrite environment variables missing! Check VITE_APPWRITE_ENDPOINT and VITE_APPWRITE_PROJECT.');
}

const client = new Client();

if (endpoint && project) {
    client
        .setEndpoint(endpoint)
        .setProject(project);
}

export { client };

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
