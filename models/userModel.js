const { getDb } = require('../db/database');

const userModel = {
    createUser: (email, password, role, club_id, callback) => {
        const db = getDb();
        db.run('INSERT INTO Users (email, password, role, club_id) VALUES (?, ?, ?, ?)', 
            [email, password, role, club_id], 
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

    updateUser: (id, email, password, role, club_id, callback) => {
        const db = getDb();
        // Build the SET clause dynamically based on provided fields
        let updates = [];
        let params = [];

        if (email !== undefined) {
            updates.push('email = ?');
            params.push(email);
        }
        if (password !== undefined) {
            updates.push('password = ?');
            params.push(password);
        }
        if (role !== undefined) {
            updates.push('role = ?');
            params.push(role);
        }
        // club_id can be null, so check for undefined
        if (club_id !== undefined) {
            updates.push('club_id = ?');
            params.push(club_id);
        }

        if (updates.length === 0) {
            return callback(null, { changes: 0 }); // No fields to update
        }

        params.push(id); // Add id for WHERE clause

        const sql = `UPDATE Users SET ${updates.join(', ')} WHERE id = ?`;
        db.run(sql, params, function(err) {
            callback(err, { changes: this.changes });
        });
    }
};

module.exports = userModel;
