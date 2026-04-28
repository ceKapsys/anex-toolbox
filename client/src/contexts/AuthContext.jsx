import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || '/api';

    // Always include cookies on auth requests; the httpOnly session cookie is
    // the source of truth for authentication.
    const axiosConfig = { withCredentials: true };

    // Always check the server on mount — the httpOnly cookie is invisible to JS,
    // so we must ask the server whether the current cookie is valid.
    useEffect(() => {
        verifySession();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const verifySession = async () => {
        try {
            const response = await axios.get(`${API_URL}/auth/verify`, axiosConfig);

            if (response.data?.authenticated) {
                setUser(response.data.user);
            } else {
                setUser(null);
            }
        } catch (err) {
            // 401 (no/expired cookie) is the normal "logged out" path — not an error
            if (err.response?.status !== 401) {
                console.error('Session verification failed:', err);
            }
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        setError(null);
        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                username,
                password
            }, axiosConfig);

            // Server now sets the httpOnly session cookie automatically; no token
            // is returned in the body and nothing is stored in localStorage.
            setUser(response.data.user);
            return { success: true };
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Login failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const logout = async () => {
        try {
            await axios.post(`${API_URL}/auth/logout`, {}, axiosConfig);
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setUser(null);
        }
    };

    const changePassword = async (currentPassword, newPassword) => {
        try {
            await axios.post(`${API_URL}/auth/change-password`, {
                currentPassword,
                newPassword
            }, axiosConfig);
            return { success: true };
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Password change failed';
            return { success: false, error: errorMessage };
        }
    };

    const value = {
        user,
        loading,
        error,
        login,
        logout,
        changePassword,
        isAuthenticated: !!user
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
