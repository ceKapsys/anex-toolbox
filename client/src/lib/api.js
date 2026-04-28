const API_URL = import.meta.env.VITE_API_URL || '/api';

// Authentication is carried exclusively by the httpOnly `session_id` cookie
// (sent automatically because we use `credentials: 'include'`). Avoid storing
// the session token anywhere JavaScript can reach — that's why we no longer
// read or write `sessionId` to localStorage.

const handleUnauthorized = () => {
    // Avoid bouncing the login page itself into a redirect loop.
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
};

const request = async (endpoint, options = {}) => {
    const url = `${API_URL}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const config = {
        ...options,
        headers,
        credentials: 'include',
    };

    try {
        const response = await fetch(url, config);
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));

            if (response.status === 401) {
                handleUnauthorized();
            }

            throw new Error(errorBody.error || `Request failed: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
};

// Multipart/FormData request (for file uploads — no Content-Type header, browser sets boundary)
const requestFormData = async (endpoint, formData) => {
    const url = `${API_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            credentials: 'include',
        });
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            if (response.status === 401) {
                handleUnauthorized();
            }
            throw new Error(errorBody.error || `Request failed: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
};

const api = {
    // Generic methods for hooks
    get: (endpoint) => request(endpoint, { method: 'GET' }),
    post: (endpoint, data) => request(endpoint, { method: 'POST', body: JSON.stringify(data) }),
    put: (endpoint, data) => request(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
    patch: (endpoint, data) => request(endpoint, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (endpoint) => request(endpoint, { method: 'DELETE' }),

    // Resource methods
    clients: {
        list: () => request('/clients'),
        create: (data) => request('/clients', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data) => request(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id) => request(`/clients/${id}`, { method: 'DELETE' }),
        get: (id) => request(`/clients/${id}`),
    },
    invoices: {
        list: () => request('/invoices'),
        create: (data) => request('/invoices', { method: 'POST', body: JSON.stringify(data) }),
        get: (id) => request(`/invoices/${id}`),
        update: (id, data) => request(`/invoices/${id}`, { method: 'PATCH', body: JSON.stringify(data) }), // Assuming PATCH for updates based on previous findings, or could be PUT
        updatePayment: (id, data) => request(`/invoices/${id}/payment`, { method: 'PATCH', body: JSON.stringify(data) }),
    },
    quotations: {
        list: () => request('/quotations'),
        create: (data) => request('/quotations', { method: 'POST', body: JSON.stringify(data) }),
        get: (id) => request(`/quotations/${id}`),
        update: (id, data) => request(`/quotations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id) => request(`/quotations/${id}`, { method: 'DELETE' }),
    },
    services: {
        list: () => request('/services'),
        create: (data) => request('/services', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data) => request(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
        delete: (id) => request(`/services/${id}`, { method: 'DELETE' }),
    },
    terms: {
        list: () => request('/terms'),
        create: (data) => request('/terms', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data) => request(`/terms/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
        delete: (id) => request(`/terms/${id}`, { method: 'DELETE' }),
    },
    settings: {
        get: () => request('/settings'),
        update: (key, value) => request('/settings', { method: 'POST', body: JSON.stringify({ key, value }) }),
    },
    email: {
        sendInvoice: (formData) => requestFormData('/email/send-invoice', formData),
        sendQuotation: (formData) => requestFormData('/email/send-quotation', formData),
        testSMTP: () => request('/email/test-smtp', { method: 'POST', body: JSON.stringify({}) }),
    }
};

export default api;
