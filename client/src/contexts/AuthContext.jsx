import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || '/api';

    // Configure axios to include cookies
    const axiosConfig = { withCredentials: true };

    // Check if user is already logged in (on mount)
    useEffect(() => {
        const storedSessionId = localStorage.getItem('sessionId');
        if (storedSessionId) {
            verifySession(storedSessionId);
        } else {
            // Still try cookie-based verification
            verifySession(null);
        }
    }, []);

    const verifySession = async (sid) => {
        try {
            const headers = {};
            if (sid) headers['x-session-id'] = sid;

            const response = await axios.get(`${API_URL}/auth/verify`, {
                headers,
                ...axiosConfig
            });

            if (response.data.authenticated) {
                setUser(response.data.user);
                setSessionId(sid);
                if (sid) localStorage.setItem('sessionId', sid);
            } else {
                logout();
            }
        } catch (error) {
            console.error('Session verification failed:', error);
            // Clear stale localStorage sessionId
            localStorage.removeItem('sessionId');
            setUser(null);
            setSessionId(null);
            setLoading(false);
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

            const { sessionId: newSessionId, user: userData } = response.data;
            setSessionId(newSessionId);
            setUser(userData);
            // Keep localStorage as fallback for x-session-id header
            localStorage.setItem('sessionId', newSessionId);
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Login failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const logout = async () => {
        try {
            const headers = {};
            if (sessionId) headers['x-session-id'] = sessionId;

            await axios.post(`${API_URL}/auth/logout`, {}, {
                headers,
                ...axiosConfig
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            setSessionId(null);
            localStorage.removeItem('sessionId');
        }
    };

    const changePassword = async (currentPassword, newPassword) => {
        try {
            const headers = {};
            if (sessionId) headers['x-session-id'] = sessionId;

            await axios.post(`${API_URL}/auth/change-password`, {
                currentPassword,
                newPassword
            }, {
                headers,
                ...axiosConfig
            });
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Password change failed';
            return { success: false, error: errorMessage };
        }
    };

    const value = {
        user,
        sessionId,
        loading,
        error,
        login,
        logout,
        changePassword,
        isAuthenticated: !!user
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
