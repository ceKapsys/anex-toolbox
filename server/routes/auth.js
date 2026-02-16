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

// Middleware to check if user is authenticated
const isAuthenticated = async (req, res, next) => {
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;

    if (!sessionId) {
        return res.status(401).json({ error: 'No session provided', authenticated: false });
    }

    const sql = `
        SELECT s.*, u.id as user_id, u.username, u.email, u.full_name 
        FROM sessions s 
        JOIN admin_users u ON s.user_id = u.id 
        WHERE s.id = ? AND datetime(s.expires_at) > datetime('now')
    `;

    db.get(sql, [sessionId], (err, session) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!session) {
            return res.status(401).json({ error: 'Invalid or expired session', authenticated: false });
        }

        req.user = {
            id: session.user_id,
            username: session.username,
            email: session.email,
            full_name: session.full_name
        };
        req.sessionId = sessionId;
        next();
    });
};

// POST /api/auth/login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    db.get("SELECT * FROM admin_users WHERE username = ?", [username], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        bcrypt.compare(password, user.password_hash, (err, isMatch) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            // Create session
            const sessionId = generateSessionId();
            const expiresAt = getSessionExpiry();

            const insertSession = `INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)`;
            db.run(insertSession, [sessionId, user.id, expiresAt], (err) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                // Update last login
                db.run("UPDATE admin_users SET last_login = datetime('now') WHERE id = ?", [user.id]);

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
            });
        });
    });
});

// POST /api/auth/logout
router.post('/logout', isAuthenticated, (req, res) => {
    db.run("DELETE FROM sessions WHERE id = ?", [req.sessionId], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Logout successful' });
    });
});

// GET /api/auth/verify
router.get('/verify', isAuthenticated, (req, res) => {
    res.json({
        authenticated: true,
        user: req.user
    });
});

// POST /api/auth/change-password (authenticated users only)
router.post('/change-password', isAuthenticated, (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    db.get("SELECT password_hash FROM admin_users WHERE id = ?", [req.user.id], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        bcrypt.compare(currentPassword, user.password_hash, (err, isMatch) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (!isMatch) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }

            bcrypt.hash(newPassword, 10, (err, hash) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                db.run("UPDATE admin_users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?",
                    [hash, req.user.id],
                    (err) => {
                        if (err) {
                            return res.status(500).json({ error: err.message });
                        }
                        res.json({ message: 'Password changed successfully' });
                    }
                );
            });
        });
    });
});

// Clean up expired sessions periodically
setInterval(() => {
    db.run("DELETE FROM sessions WHERE datetime(expires_at) <= datetime('now')", (err) => {
        if (err) console.error('Error cleaning up sessions:', err);
    });
}, 3600000); // Run every hour

module.exports = { router, isAuthenticated };
