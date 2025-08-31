const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.resolve(__dirname, './padelflow.db');

let db;

function initDatabase() {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('Error connecting to database:', err.message);
                reject(err);
            } else {
                console.log('Connected to the SQLite database.');
                const initSql = fs.readFileSync(path.resolve(__dirname, './init.sql'), 'utf-8');
                db.exec(initSql, (err) => {
                    if (err) {
                        console.error('Error initializing database:', err.message);
                        reject(err);
                    } else {
                        console.log('Database initialized successfully.');
                        
                        // Check for and create default platform admin if not exists
                        const DEFAULT_ADMIN_EMAIL = 'admin@padelflow.com';
                        const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'adminpassword'; // In a real app, use env vars

                        db.get('SELECT id FROM Users WHERE email = ? AND role = ?', [DEFAULT_ADMIN_EMAIL, 'platform_admin'], (err, row) => {
                            if (err) {
                                console.error('Error checking for default platform admin:', err.message);
                                return reject(err);
                            }
                            if (!row) {
                                bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10, (err, hashedPassword) => {
                                    if (err) {
                                        console.error('Error hashing default platform admin password:', err.message);
                                        return reject(err);
                                    }
                                    db.run('INSERT INTO Users (name, email, password, role, club_id) VALUES (?, ?, ?, ?, ?)', 
                                        ["Admin", DEFAULT_ADMIN_EMAIL, hashedPassword, 'platform_admin', null], 
                                        function(err) {
                                            if (err) {
                                                console.error('Error creating default platform admin:', err.message);
                                                return reject(err);
                                            }
                                            console.log('Default platform admin created with ID:', this.lastID);
                                            resolve(db);
                                        }
                                    );
                                });
                            } else {
                                console.log('Default platform admin already exists.');
                                resolve(db);
                            }
                        });
                    }
                });
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