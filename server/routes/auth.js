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

// Cookie options for session
const isProduction = process.env.NODE_ENV === 'production';
const getSessionCookieOptions = (maxAge) => ({
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: maxAge || 24 * 60 * 60 * 1000, // 24 hours
    path: '/'
});

// Password strength validation
const validatePasswordStrength = (password) => {
    if (!password || password.length < 8) {
        return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
        return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
        return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
        return 'Password must contain at least one number';
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        return 'Password must contain at least one special character';
    }
    return null;
};

// Middleware to check if user is authenticated via httpOnly session cookie
const isAuthenticated = async (req, res, next) => {
    const sessionId = req.cookies?.session_id;

    if (!sessionId) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const session = await authRepository.findSessionById(sessionId);

        if (!session) {
            res.clearCookie('session_id', { path: '/' });
            return res.status(401).json({ error: 'Invalid or expired session' });
        }

        // Check if session has expired
        if (new Date(session.expires_at) < new Date()) {
            await authRepository.deleteSession(sessionId);
            res.clearCookie('session_id', { path: '/' });
            return res.status(401).json({ error: 'Session expired' });
        }

        req.user = {
            id: session.user.id,
            username: session.user.username,
            email: session.user.email,
            full_name: session.user.full_name
        };
        req.sessionId = sessionId;
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(500).json({ error: 'Authentication error' });
    }
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

        // Invalidate all existing sessions for this user before creating a new one
        try {
            await authRepository.deleteUserSessions(user.id);
        } catch (sessionErr) {
            console.error('Failed to clear old sessions:', sessionErr.message);
            // Non-fatal: continue with login even if old session cleanup fails
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

        // Set httpOnly cookie (primary auth transport)
        res.cookie('session_id', sessionId, getSessionCookieOptions());

        // Note: sessionId intentionally NOT returned in body — the httpOnly cookie
        // is the source of truth. Returning it here would let JavaScript (and any
        // XSS payload) read it, defeating the httpOnly protection.
        res.json({
            message: 'Login successful',
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
        res.clearCookie('session_id', { path: '/' });
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

    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
        return res.status(400).json({ error: passwordError });
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

        const hash = await bcrypt.hash(newPassword, 12);

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

// POST /api/auth/seed - Create or reset default admin user (protected by env secret)
router.post('/seed', async (req, res) => {
    // Require a seed secret from environment variable
    const seedSecret = process.env.SEED_SECRET;
    if (!seedSecret) {
        return res.status(404).json({ error: 'Not found' });
    }

    const providedSecret = req.headers['x-seed-secret'] || req.body.seed_secret;
    if (providedSecret !== seedSecret) {
        return res.status(404).json({ error: 'Not found' });
    }

    try {
        const defaultUsername = process.env.SEED_ADMIN_EMAIL;
        const defaultPassword = process.env.SEED_ADMIN_PASSWORD;

        if (!defaultUsername || !defaultPassword) {
            return res.status(500).json({ error: 'Seed credentials not configured in environment' });
        }

        const passwordHash = await bcrypt.hash(defaultPassword, 12);

        // Check if user with this username already exists
        let user = await authRepository.findByUsername(defaultUsername);

        if (user) {
            // Update existing user's password
            await authRepository.update(user.id, {
                password_hash: passwordHash,
                email: defaultUsername,
                updated_at: new Date()
            });
            return res.json({
                message: 'Admin user password reset',
                seeded: true,
                user: { id: user.id, username: user.username }
            });
        }

        // Create new user
        const newUser = await authRepository.create({
            username: defaultUsername,
            password_hash: passwordHash,
            email: defaultUsername,
            full_name: process.env.SEED_ADMIN_NAME || 'Administrator'
        });

        res.json({
            message: 'Default admin user created',
            seeded: true,
            user: { id: newUser.id, username: newUser.username }
        });
    } catch (err) {
        console.error('Seed Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = { router, isAuthenticated };
