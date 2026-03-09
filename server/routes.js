const express = require('express');
const router = express.Router();
const { getConnection } = require('./db');

// -- Close a standalone mysql2 connection created via mysql.createConnection()
//    These do not have .release() -- always use .end() to close them cleanly.
async function closeConnection(connection) {
    if (!connection) return;
    try {
        await connection.end();
    } catch (e) {
        console.warn('[closeConnection] Could not close DB connection:', e.message);
    }
}

// ── Shared error classifier ───────────────────────────────────────────────────
function classifyDbError(err) {
    const mysqlErrors = {
        ER_DUP_ENTRY:              { status: 409, message: 'A record with this value already exists.' },
        ER_NO_REFERENCED_ROW_2:    { status: 400, message: 'Referenced record does not exist.' },
        ER_DATA_TOO_LONG:          { status: 400, message: 'One or more fields exceed the maximum allowed length.' },
        ER_TRUNCATED_WRONG_VALUE:  { status: 400, message: 'Invalid value provided for one or more fields.' },
        ECONNREFUSED:              { status: 503, message: 'Database connection refused. Please try again later.' },
        PROTOCOL_CONNECTION_LOST:  { status: 503, message: 'Database connection was lost. Please try again later.' },
        ER_LOCK_DEADLOCK:          { status: 503, message: 'Database is busy. Please retry your request.' },
    };

    return mysqlErrors[err.code] || { status: 500, message: 'An unexpected database error occurred.' };
}

// ── Input validation helper ───────────────────────────────────────────────────
function validateCensusInput({ FirstName, LastName, SSN, EmailId, Eid }) {
    const errors = [];

    if (!FirstName || FirstName.trim().length < 2)
        errors.push({ field: 'FirstName', message: 'First name is required and must be at least 2 characters.' });

    if (!LastName || LastName.trim().length < 2)
        errors.push({ field: 'LastName', message: 'Last name is required and must be at least 2 characters.' });

    if (!SSN || !/^\d{3}-\d{2}-\d{4}$/.test(SSN))
        errors.push({ field: 'SSN', message: 'SSN is required and must follow the format XXX-XX-XXXX.' });

    if (!EmailId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(EmailId))
        errors.push({ field: 'EmailId', message: 'A valid email address is required.' });

    if (!Eid || !/^\d+$/.test(String(Eid)))
        errors.push({ field: 'Eid', message: 'EID is required and must be a numeric value.' });

    return errors;
}

// ── POST /api/addCensus ───────────────────────────────────────────────────────
router.post('/addCensus', async (req, res) => {
    // 1. Client-side style input validation before hitting the DB
    const validationErrors = validateCensusInput(req.body);
    if (validationErrors.length > 0) {
        return res.status(422).json({
            success: false,
            message: `Validation failed with ${validationErrors.length} error(s)`,
            errors: validationErrors,
        });
    }

    let connection;
    try {
        const { FirstName, LastName, SSN, EmailId, Eid } = req.body;
        connection = await getConnection();

        // 2. Call stored procedure
        await connection.query(
            `CALL ValidateAndInsertCensus(?, ?, ?, ?, ?, @p_Success, @p_Message, @p_InsertedId)`,
            [FirstName.trim(), LastName.trim(), SSN, EmailId.trim(), Eid]
        );

        // 3. Retrieve output parameters
        const [outputParams] = await connection.query(
            'SELECT @p_Success AS Success, @p_Message AS Message, @p_InsertedId AS InsertedId'
        );

        const { Success, Message, InsertedId } = outputParams[0];

        // 4. Stored procedure reported a business-rule failure
        if (!Success) {
            return res.status(400).json({
                success: false,
                message: Message || 'The record could not be saved. Please check your input and try again.',
            });
        }

        return res.status(201).json({
            success: true,
            message: Message || 'Census record created successfully.',
            id: InsertedId,
        });

    } catch (err) {
        console.error(`[addCensus] ${new Date().toISOString()}`, err);
        const { status, message } = classifyDbError(err);
        return res.status(status).json({
            success: false,
            message,
            ...(process.env.NODE_ENV === 'development' && { detail: err.message }),
        });
    } finally {
        await closeConnection(connection);
    }
});

// ── GET /api/getCensus ────────────────────────────────────────────────────────
router.get('/getCensus', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [results] = await connection.query('SELECT * FROM CensusDetails ORDER BY id DESC');

        return res.status(200).json({
            success: true,
            total: results.length,
            data: results,
        });

    } catch (err) {
        console.error(`[getCensus] ${new Date().toISOString()}`, err);
        const { status, message } = classifyDbError(err);
        return res.status(status).json({
            success: false,
            message,
            ...(process.env.NODE_ENV === 'development' && { detail: err.message }),
        });
    } finally {
        await closeConnection(connection);
    }
});

// ── GET /api/getCensus/:id ────────────────────────────────────────────────────
router.get('/getCensus/:id', async (req, res) => {
    const { id } = req.params;

    // Validate id is a positive integer before querying
    if (!id || !/^\d+$/.test(id) || parseInt(id, 10) < 1) {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID. ID must be a positive integer.',
        });
    }

    let connection;
    try {
        connection = await getConnection();
        const [results] = await connection.query(
            'SELECT * FROM CensusDetails WHERE id = ?',
            [parseInt(id, 10)]
        );

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No census record found with ID ${id}.`,
            });
        }

        return res.status(200).json({
            success: true,
            data: results[0],
        });

    } catch (err) {
        console.error(`[getCensus/:id] ${new Date().toISOString()}`, err);
        const { status, message } = classifyDbError(err);
        return res.status(status).json({
            success: false,
            message,
            ...(process.env.NODE_ENV === 'development' && { detail: err.message }),
        });
    } finally {
        await closeConnection(connection);
    }
});


// ── GET /api/searchCensus?q=&field= ──────────────────────────────────────────
// q     : search term (required)
// field : FirstName | LastName | SSN | EmailId | Eid | all  (default: all)
router.get('/searchCensus', async (req, res) => {
    const q     = (req.query.q     || '').trim();
    const field = (req.query.field || 'all').trim();

    if (!q) {
        return res.status(400).json({
            success: false,
            message: 'Search term "q" is required.',
        });
    }
    if (q.length < 2) {
        return res.status(400).json({
            success: false,
            message: 'Search term must be at least 2 characters.',
        });
    }

    const allowed = ['FirstName', 'LastName', 'SSN', 'EmailId', 'Eid', 'all'];
    if (!allowed.includes(field)) {
        return res.status(400).json({
            success: false,
            message: `Invalid field. Must be one of: ${allowed.join(', ')}.`,
        });
    }

    let connection;
    try {
        connection = await getConnection();
        const like = `%${q}%`;
        let sql, params;

        if (field === 'all') {
            sql = `SELECT * FROM CensusDetails
                   WHERE FirstName LIKE ?
                      OR LastName  LIKE ?
                      OR SSN       LIKE ?
                      OR EmailId   LIKE ?
                      OR Eid       LIKE ?
                   ORDER BY id DESC`;
            params = [like, like, like, like, like];
        } else {
            sql    = `SELECT * FROM CensusDetails WHERE ?? LIKE ? ORDER BY id DESC`;
            params = [field, like];
        }

        const [results] = await connection.query(sql, params);

        return res.status(200).json({
            success: true,
            total:   results.length,
            query:   q,
            field,
            data:    results,
        });

    } catch (err) {
        console.error(`[searchCensus] ${new Date().toISOString()}`, err);
        const { status, message } = classifyDbError(err);
        return res.status(status).json({
            success: false,
            message,
            ...(process.env.NODE_ENV === 'development' && { detail: err.message }),
        });
    } finally {
        await closeConnection(connection);
    }
});

module.exports = router;
