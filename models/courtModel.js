const { getDb } = require('../db/database');

const courtModel = {
    getCourtsByClub: (club_id, callback) => {
        const db = getDb();
        db.all('SELECT * FROM Courts WHERE club_id = ?', [club_id], (err, rows) => {
            callback(err, rows);
        });
    },

    getAvailableCourtsByClub: (club_id, limit, callback) => {
        const db = getDb();
        let sql = "SELECT * FROM Courts WHERE club_id = ? AND status = 'available'";
        const params = [club_id];
        if (limit) {
            sql += ' LIMIT ?';
            params.push(limit);
        }
        db.all(sql, params, callback);
    },

    getCourtById: (id, callback) => {
        const db = getDb();
        db.get('SELECT * FROM Courts WHERE id = ?', [id], (err, row) => {
            callback(err, row);
        });
    },

    updateCourtStatus: (court_id, status, callback) => {
        const db = getDb();
        db.run('UPDATE Courts SET status = ? WHERE id = ?', 
            [status, court_id], 
            function(err) {
                callback(err, { changes: this.changes });
            }
        );
    },

    createCourt: (club_id, name, callback) => {
        const db = getDb();
        const status = 'available'; // Default status for new courts
        db.run('INSERT INTO Courts (club_id, name, status) VALUES (?, ?, ?)',
            [club_id, name, status],
            function(err) {
                callback(err, { id: this.lastID, name, status }); // Return name and status for frontend update
            }
        );
    },

    updateCourt: (court_id, name, status, callback) => {
        const db = getDb();
        db.run('UPDATE Courts SET name = ?, status = ? WHERE id = ?',
            [name, status, court_id],
            function(err) {
                callback(err, { changes: this.changes });
            }
        );
    },

    deleteCourt: (court_id, callback) => {
        const db = getDb();
        db.run('DELETE FROM Courts WHERE id = ?',
            [court_id],
            function(err) {
                callback(err, { changes: this.changes });
            }
        );
    },

    getCourtsByTournament: (tournamentId, callback) => {
        const db = getDb();
        const sql = `
            SELECT c.* FROM Courts c
            JOIN tournament_courts tc ON c.id = tc.court_id
            WHERE tc.tournament_id = ?
        `;
        db.all(sql, [tournamentId], callback);
    }
};

module.exports = courtModel;