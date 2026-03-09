const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const routes     = require('./routes');
const authRoutes  = require('./authRoutes');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ── API routes MUST be registered before static middleware ────────────────────
// If static comes first, express.static serves index.html for any path it
// cannot find a file for — including /api/* routes — causing 404 HTML responses.
app.use('/api/auth', authRoutes);  // auth FIRST (no token needed)
app.use('/api', routes);

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, '../client')));

// Serve index.html only for the root path (SPA entry point)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// ── 404 handler – unknown routes ─────────────────────────────────────────────
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route '${req.method} ${req.originalUrl}' not found`,
    });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] ERROR:`, err);

    // Malformed JSON in request body
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON in request body',
        });
    }

    // MySQL errors
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            success: false,
            message: 'A record with this value already exists',
            field: err.sqlMessage || null,
        });
    }

    if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
        return res.status(503).json({
            success: false,
            message: 'Database connection lost. Please try again later.',
        });
    }

    // Validation errors (e.g. from express-validator)
    if (err.status === 422 && Array.isArray(err.errors)) {
        return res.status(422).json({
            success: false,
            message: 'Validation failed',
            errors: err.errors,
        });
    }

    // HTTP errors with an explicit status code
    if (err.status && err.status < 500) {
        return res.status(err.status).json({
            success: false,
            message: err.message || 'Request error',
        });
    }

    // Fallback: 500 Internal Server Error
    res.status(500).json({
        success: false,
        message: 'An unexpected server error occurred. Please try again later.',
        ...(process.env.NODE_ENV === 'development' && {
            detail: err.message,
            stack:  err.stack,
        }),
    });
});

// ── Unhandled promise rejections & exceptions ─────────────────────────────────
process.on('unhandledRejection', (reason) => {
    console.error(`[${new Date().toISOString()}] Unhandled Rejection:`, reason);
});

process.on('uncaughtException', (err) => {
    console.error(`[${new Date().toISOString()}] Uncaught Exception:`, err);
    process.exit(1);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
