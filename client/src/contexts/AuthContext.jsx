import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_URL = 'http://localhost:5000/api';

    // Check if user is already logged in (on mount)
    useEffect(() => {
        const storedSessionId = localStorage.getItem('sessionId');
        if (storedSessionId) {
            verifySession(storedSessionId);
        } else {
            setLoading(false);
        }
    }, []);

    const verifySession = async (sid) => {
        try {
            const response = await axios.get(`${API_URL}/auth/verify`, {
                headers: {
                    'x-session-id': sid
                }
            });
            
            if (response.data.authenticated) {
                setUser(response.data.user);
                setSessionId(sid);
                localStorage.setItem('sessionId', sid);
            } else {
                logout();
            }
        } catch (error) {
            console.error('Session verification failed:', error);
            logout();
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
            });

            const { sessionId: newSessionId, user: userData } = response.data;
            setSessionId(newSessionId);
            setUser(userData);
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
            if (sessionId) {
                await axios.post(`${API_URL}/auth/logout`, {}, {
                    headers: {
                        'x-session-id': sessionId
                    }
                });
            }
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
            await axios.post(`${API_URL}/auth/change-password`, {
                currentPassword,
                newPassword
            }, {
                headers: {
                    'x-session-id': sessionId
                }
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
