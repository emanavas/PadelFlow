const { getDb } = require('../db/database');

const clubModel = {
createClub: (name, address, city, contact_email, contact_phone, callback) => {
        const db = getDb();
        db.run('INSERT INTO Clubs (name, address, city, email, phone) VALUES (?, ?, ?, ?, ?)', 
               [name, address, city, contact_email, contact_phone], function(err) {
            if (err) {
                return callback(err);
            }
            callback(null, { id: this.lastID || null }); 
        });
    },

    getClubById: (id, callback) => {
        const db = getDb();
        db.get('SELECT * FROM Clubs WHERE id = ?', [id], (err, row) => {
            callback(err, row);
        });
    },

    getClubPlan: (clubId, callback) => {
        const db = getDb();
        db.get('SELECT plan FROM Clubs WHERE id = ?', [clubId], (err, row) => {
            callback(err, row);
        });
    },

    getClubsByActivity: (callback) => {
        const db = getDb();
        const sql = `
            SELECT
                C.id,
                C.name,
                COUNT(T.id) AS tournament_count
            FROM
                Clubs C
            LEFT JOIN
                Tournaments T ON C.id = T.club_id
            GROUP BY
                C.id, C.name
            ORDER BY
                tournament_count DESC
            LIMIT 10;
        `;
        db.all(sql, [], (err, rows) => {
            callback(err, rows);
        });
    },

    getAllClubs: (callback) => {
        const db = getDb();
        const sql = `SELECT * FROM Clubs`;
        db.all(sql, [], (err, rows) => {
            callback(err, rows);
        });
    },

    deleteClub: (id, callback) => {
        const db = getDb();
        const sql = 'DELETE FROM Clubs WHERE id = ?';
        db.run(sql, [id], function(err) {
            callback(err, { changes: this.changes });
        });
    }
};

module.exports = clubModel;