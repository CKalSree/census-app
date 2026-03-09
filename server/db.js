const mysql = require('mysql2/promise');

const config = {
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'censusdb'
};

async function getConnection() {
    try {
        let connection = await mysql.createConnection(config);
        return connection;
    } catch (err) {
        console.error("Database connection failed: ", err);
        throw err;
    }
}

module.exports = {
    getConnection
};