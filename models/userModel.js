const { dbRun, dbGet, dbAll } = require('../db/dbHelpers');

const userModel = {
    async createUser(name, email, password, role, club_id) {
        const sql = 'INSERT INTO Users (name, email, password, role, club_id) VALUES (?, ?, ?, ?, ?)';
        return dbRun(sql, [name, email, password, role, club_id]);
    },

    async findUserByEmail(email) {
        return dbGet('SELECT * FROM Users WHERE email = ?', [email]);
    },

    async findUserById(id) {
        return dbGet('SELECT * FROM Users WHERE id = ?', [id]);
    },

    async getAllUsers() {
        const sql = 'SELECT U.*, C.name AS club_name FROM Users U LEFT JOIN Clubs C ON U.club_id = C.id';
        return dbAll(sql);
    },

    async updateUser(id, fields) {
        const updates = [];
        const params = [];

        for (const key in fields) {
            if (fields[key] !== undefined) {
                updates.push(`${key} = ?`);
                params.push(fields[key]);
            }
        }

        if (updates.length === 0) {
            return { changes: 0 };
        }

        params.push(id);
        const sql = `UPDATE Users SET ${updates.join(', ')} WHERE id = ?`;
        return dbRun(sql, params);
    }
};

module.exports = userModel;
