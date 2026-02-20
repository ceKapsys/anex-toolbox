const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const authRepository = require('../repositories/AuthRepository');

// Helper function to generate session ID
const generateSessionId = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Helper function to set session expiry (24 hours from now)
const getSessionExpiry = () => {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);
    return expiry.toISOString();
};

// Middleware to check if user is authenticated (Bypassed for Auto-Login)
const isAuthenticated = async (req, res, next) => {
    // Auto-login mock user
    req.user = {
        id: 1,
        username: 'emamul.haque@anexbusiness.com',
        email: 'emamul.haque@anexbusiness.com',
        full_name: 'Anex Admin'
    };
    req.sessionId = 'auto-generated-session';
    next();
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const user = await authRepository.findByUsername(username);

        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Create session
        const sessionId = generateSessionId();
        const expiresAt = getSessionExpiry();

        await authRepository.createSession({
            id: sessionId,
            user_id: user.id,
            expires_at: expiresAt
        });

        // Update last login
        await authRepository.update(user.id, { last_login: new Date() });

        res.json({
            message: 'Login successful',
            sessionId: sessionId,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name
            }
        });
    } catch (err) {
        console.error('Login Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/logout
router.post('/logout', isAuthenticated, async (req, res) => {
    try {
        await authRepository.deleteSession(req.sessionId);
        res.json({ message: 'Logout successful' });
    } catch (err) {
        console.error('Logout Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/auth/verify
router.get('/verify', isAuthenticated, (req, res) => {
    res.json({
        authenticated: true,
        user: req.user
    });
});

// POST /api/auth/change-password (authenticated users only)
router.post('/change-password', isAuthenticated, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    try {
        const user = await authRepository.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const hash = await bcrypt.hash(newPassword, 10);

        await authRepository.update(user.id, {
            password_hash: hash,
            updated_at: new Date()
        });

        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        console.error('Change Password Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Clean up expired sessions periodically
setInterval(async () => {
    try {
        await authRepository.deleteExpiredSessions();
    } catch (err) {
        console.error('Error cleaning up sessions:', err);
    }
}, 3600000); // Run every hour

module.exports = { router, isAuthenticated };
