const express = require('express');
const router = express.Router();
const { getConnection } = require('./db');

router.post('/addCensus', async (req, res) => {
    try {
        const { FirstName, LastName, SSN, EmailId, Eid } = req.body;
        const connection = await getConnection();

        // Call the stored procedure for validation and insertion
        const [results] = await connection.query(
            `CALL ValidateAndInsertCensus(?, ?, ?, ?, ?, @p_Success, @p_Message, @p_InsertedId)`,
            [FirstName, LastName, SSN, EmailId, Eid]
        );

        // Retrieve the output parameters
        const [outputParams] = await connection.query('SELECT @p_Success as Success, @p_Message as Message, @p_InsertedId as InsertedId');
        
        const { Success, Message, InsertedId } = outputParams[0];

        if (Success) {
            res.status(200).json({ 
                message: Message,
                id: InsertedId,
                success: true
            });
        } else {
            res.status(400).json({ 
                message: Message,
                success: false
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ 
            message: err.message,
            success: false
        });
    }
});

router.get('/getCensus', async (req, res) => {
    try {
        const connection = await getConnection();
        const [results] = await connection.query('SELECT * FROM CensusDetails');
        res.status(200).json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.get('/getCensus/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();
        const [results] = await connection.query('SELECT * FROM CensusDetails WHERE id = ?', [id]);
        
        if (results.length === 0) {
            return res.status(404).json({ message: "Census record not found" });
        }
        
        res.status(200).json(results[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;