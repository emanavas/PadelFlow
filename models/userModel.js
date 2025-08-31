const { getDb } = require('../db/database');

const userModel = {
    createUser: (name, email, password, role, club_id, callback) => {
        const db = getDb();
        db.run('INSERT INTO Users (name, email, password, role, club_id) VALUES (?, ?, ?, ?, ?)', 
            [name, email, password, role, club_id], 
            function(err) {
                callback(err, { id: this.lastID });
            }
        );
    },

    findUserByEmail: (email, callback) => {
        const db = getDb();
        db.get('SELECT * FROM Users WHERE email = ?', [email], (err, row) => {
            callback(err, row);
        });
    },

    findUserById: (id, callback) => {
        const db = getDb();
        db.get('SELECT * FROM Users WHERE id = ?', [id], (err, row) => {
            callback(err, row);
        });
    },

    getAllUsers: (callback) => {
        const db = getDb();
        db.all('SELECT U.*, C.name AS club_name FROM Users U LEFT JOIN Clubs C ON U.club_id = C.id', [], (err, rows) => {
            callback(err, rows);
        });
    },

    updateUser: (id, fields, callback) => {
        const db = getDb();
        const updates = [];
        const params = [];

        // Build the SET clause dynamically based on the fields provided
        for (const key in fields) {
            if (fields[key] !== undefined) {
                updates.push(`${key} = ?`);
                params.push(fields[key]);
            }
        }

        if (updates.length === 0) {
            return callback(null, { changes: 0 }); // No fields to update
        }

        params.push(id); // Add id for the WHERE clause

        const sql = `UPDATE Users SET ${updates.join(', ')} WHERE id = ?`;

        db.run(sql, params, function(err) {
            callback(err, { changes: this.changes });
        });
    }
};

module.exports = userModel;
