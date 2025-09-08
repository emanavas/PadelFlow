const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.resolve(__dirname, './padelflow.db');

let db;

function initDatabase() {
    return new Promise((resolve, reject) => {
        const dbExists = fs.existsSync(DB_PATH);

        db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('Error connecting to database:', err.message);
                return reject(err);
            }
            console.log('Connected to the SQLite database.');

            if (!dbExists) {
                console.log('Database file not found, initializing schema...');
                const initSql = fs.readFileSync(path.resolve(__dirname, './init.sql'), 'utf-8');
                
                db.exec(initSql, (err) => {
                    if (err) {
                        console.error('Error initializing database schema:', err.message);
                        return reject(err);
                    }
                    console.log('Database schema initialized successfully.');
                    // Inform the caller that the DB was just created.
                    resolve({ db, justCreated: true });
                });
            } else {
                // If the DB already existed, just resolve.
                resolve({ db, justCreated: false });
            }
        });
    });
}

function getDb() {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db;
}

module.exports = { initDatabase, getDb };