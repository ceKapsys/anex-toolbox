import { ID, Query } from 'appwrite';
import { databases, DATABASE_ID, COLLECTIONS } from './appwrite';

const api = {
    settings: {
        get: async () => {
            try {
                const response = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTIONS.SETTINGS
                );
                const settings = {};
                response.documents.forEach(doc => {
                    try {
                        settings[doc.key] = JSON.parse(doc.value);
                    } catch {
                        settings[doc.key] = doc.value;
                    }
                });
                return settings;
            } catch (error) {
                console.error("Appwrite Settings Get Error:", error);
                return {};
            }
        },
        update: async (key, value) => {
            try {
                const valStr = typeof value === 'object' ? JSON.stringify(value) : value;

                // Check if exists
                const existing = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTIONS.SETTINGS,
                    [Query.equal('key', key)]
                );

                if (existing.documents.length > 0) {
                    return await databases.updateDocument(
                        DATABASE_ID,
                        COLLECTIONS.SETTINGS,
                        existing.documents[0].$id,
                        { value: valStr }
                    );
                } else {
                    return await databases.createDocument(
                        DATABASE_ID,
                        COLLECTIONS.SETTINGS,
                        ID.unique(),
                        { key, value: valStr }
                    );
                }
            } catch (error) {
                console.error("Appwrite Settings Update Error:", error);
                throw error;
            }
        }
    },
    clients: {
        list: async () => {
            const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CLIENTS, [Query.limit(100), Query.orderDesc('$createdAt')]);
            return response.documents;
        },
        create: async (data) => {
            return await databases.createDocument(DATABASE_ID, COLLECTIONS.CLIENTS, ID.unique(), data);
        },
        update: async (id, data) => {
            return await databases.updateDocument(DATABASE_ID, COLLECTIONS.CLIENTS, id, data);
        },
        delete: async (id) => {
            return await databases.deleteDocument(DATABASE_ID, COLLECTIONS.CLIENTS, id);
        }
    },
    invoices: {
        list: async () => {
            const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.INVOICES, [Query.limit(100), Query.orderDesc('created_at')]);
            return response.documents;
        },
        create: async (data) => {
            return await databases.createDocument(DATABASE_ID, COLLECTIONS.INVOICES, ID.unique(), data);
        },
        get: async (id) => {
            return await databases.getDocument(DATABASE_ID, COLLECTIONS.INVOICES, id);
        },
        update: async (id, data) => {
            return await databases.updateDocument(DATABASE_ID, COLLECTIONS.INVOICES, id, data);
        }
    },
    quotations: {
        list: async () => {
            const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.QUOTATIONS, [Query.limit(100), Query.orderDesc('created_at')]);
            return response.documents;
        },
        create: async (data) => {
            return await databases.createDocument(DATABASE_ID, COLLECTIONS.QUOTATIONS, ID.unique(), data);
        },
        update: async (id, data) => {
            return await databases.updateDocument(DATABASE_ID, COLLECTIONS.QUOTATIONS, id, data);
        }
    }
};

export default api;
