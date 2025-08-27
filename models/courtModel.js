const { getDb } = require('../db/database');

const courtModel = {
    getCourtsByClub: (club_id, callback) => {
        const db = getDb();
        db.all('SELECT * FROM Courts WHERE club_id = ?', [club_id], (err, rows) => {
            callback(err, rows);
        });
    },

    getAvailableCourtsByClub: (club_id, callback) => {
        const db = getDb();
        db.all('SELECT * FROM Courts WHERE club_id = ? AND status = \'available\'', [club_id], (err, rows) => {
            callback(err, rows);
        });
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
        db.run('INSERT INTO Courts (club_id, name) VALUES (?, ?)', 
            [club_id, name], 
            function(err) {
                callback(err, { id: this.lastID });
            }
        );
    }
};

module.exports = courtModel;
