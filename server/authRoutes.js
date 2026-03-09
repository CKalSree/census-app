// server/authRoutes.js
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { getConnection } = require('./db');

const JWT_SECRET  = process.env.JWT_SECRET  || 'census_jwt_secret_change_in_production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';

// ── Close standalone mysql2 connection ───────────────────────────────────────
async function closeConnection(conn) {
    if (!conn) return;
    try { await conn.end(); } catch (e) { /* ignore */ }
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Input validation
    const errors = [];
    if (!username || !username.trim())
        errors.push({ field: 'username', message: 'Username is required.' });
    if (!password)
        errors.push({ field: 'password', message: 'Password is required.' });

    if (errors.length) {
        return res.status(422).json({ success: false, message: 'Please fill in all fields.', errors });
    }

    let connection;
    try {
        connection = await getConnection();

        // Look up user by username OR email
        const [rows] = await connection.query(
            `SELECT id, username, email, password_hash, full_name, role, is_active
             FROM users
             WHERE username = ? OR email = ?
             LIMIT 1`,
            [username.trim(), username.trim()]
        );

        // Always run bcrypt even if user not found (prevent timing attacks)
        const dummyHash = '$2b$10$OXUZ85j21qjF/mK15F73ReL4ee6lSD5ZIh6GUx4UczogCZ1OxLPca';
        const user      = rows[0] || null;
        const hash      = user ? user.password_hash : dummyHash;

        // Validate that the stored hash looks like a valid bcrypt hash
        if (user && !hash.startsWith('$2')) {
            console.error(`[login] Invalid hash format for user "${username}". Re-run users_schema.sql or reset_admin_password.sql`);
        }

        const match = await bcrypt.compare(password, hash);
        console.log(`[login] user="${username}" found=${!!user} hashPrefix="${hash.slice(0,7)}" match=${match}`);

        if (!user || !match) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password.',
                errors:  [{ field: '_global', message: 'Invalid username or password.' }],
            });
        }

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact an administrator.',
            });
        }

        // Update last_login timestamp
        await connection.query(
            'UPDATE users SET last_login = NOW() WHERE id = ?',
            [user.id]
        );

        // Sign JWT
        const roleLabels = {
            admin:      'Administrator',
            manager:    'Manager',
            compliance: 'Compliance Officer',
            hr:         'HR Officer',
            user:       'User',
        };
        const token = jwt.sign(
            {
                id:        user.id,
                username:  user.username,
                role:      user.role,
                roleLabel: roleLabels[user.role] || user.role,
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        return res.status(200).json({
            success: true,
            message: `Welcome back, ${user.full_name || user.username}!`,
            token,
            user: {
                id:        user.id,
                username:  user.username,
                email:     user.email,
                fullName:  user.full_name,
                role:      user.role,
                roleLabel: roleLabels[user.role] || user.role,
            },
        });

    } catch (err) {
        console.error(`[login] ${new Date().toISOString()}`, err);
        return res.status(500).json({
            success: false,
            message: 'A server error occurred. Please try again later.',
        });
    } finally {
        await closeConnection(connection);
    }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
// JWT is stateless; logout is handled client-side by removing the token.
// This endpoint exists so the frontend can make a clean call and the server
// can log the event or invalidate refresh tokens in future.
router.post('/logout', (req, res) => {
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

// ── GET /api/auth/me  – validate token & return current user ─────────────────
router.get('/me', (req, res) => {
    const header = req.headers['authorization'] || '';
    const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return res.status(200).json({ success: true, user: decoded });
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Token is invalid or expired.' });
    }
});

module.exports = router;
