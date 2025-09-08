const { getDb } = require('./database');

/**
 * Runs a SQL query that doesn't return rows (INSERT, UPDATE, DELETE).
 * @param {string} sql The SQL query to execute.
 * @param {Array} params Parameters for the SQL query.
 * @returns {Promise<object>} Resolves with the 'this' object from the database driver, containing lastID and changes.
 */
function dbRun(sql, params = []) {
    const db = getDb();
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                console.error('SQL Error in dbRun:', err.message);
                reject(err);
            } else {
                resolve(this);
            }
        });
    });
}

/**
 * Runs a SELECT query and returns the first row.
 * @param {string} sql The SQL query to execute.
 * @param {Array} params Parameters for the SQL query.
 * @returns {Promise<object>} Resolves with a single row object, or undefined if no rows are found.
 */
function dbGet(sql, params = []) {
    const db = getDb();
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                console.error('SQL Error in dbGet:', err.message);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

/**
 * Runs a SELECT query and returns all rows.
 * @param {string} sql The SQL query to execute.
 * @param {Array} params Parameters for the SQL query.
 *
@returns {Promise<Array>} Resolves with an array of row objects.
 */
function dbAll(sql, params = []) {
    const db = getDb();
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                console.error('SQL Error in dbAll:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

module.exports = {
    dbRun,
    dbGet,
    dbAll,
};