const { getDb } = require('../db/database');

const playerModel = {
    createPlayer: (tournament_id, user_id, name, callback) => {
        const db = getDb();
        db.run('INSERT INTO Players (tournament_id, user_id, name) VALUES (?, ?, ?)', 
            [tournament_id, user_id, name], 
            function(err) {
                callback(err, { id: this.lastID });
            }
        );
    },

    getPlayerById: (id, callback) => {
        const db = getDb();
        db.get('SELECT * FROM Players WHERE id = ?', [id], (err, row) => {
            callback(err, row);
        });
    },

    getPlayersByTournamentId: (tournament_id, callback) => {
        const db = getDb();
        db.all('SELECT * FROM Players WHERE tournament_id = ?', [tournament_id], (err, rows) => {
            callback(err, rows);
        });
    },

    getPlayersByClubId: (club_id, callback) => {
        const db = getDb();
        db.all('SELECT p.* FROM Players p JOIN Tournaments t ON p.tournament_id = t.id WHERE t.club_id = ?', [club_id], (err, rows) => {
            callback(err, rows);
        });
    },

    addPlayerToTournament: (player_id, tournament_id, callback) => {
        const db = getDb();
        db.run('UPDATE Players SET tournament_id = ? WHERE id = ?', 
            [tournament_id, player_id], 
            function(err) {
                callback(err, { changes: this.changes });
            }
        );
    },

    updatePlayer: (id, name, callback) => {
        const db = getDb();
        db.run('UPDATE Players SET name = ? WHERE id = ?', 
            [name, id], 
            function(err) {
                callback(err, { changes: this.changes });
            }
        );
    },

    deletePlayer: (id, callback) => {
        const db = getDb();
        db.run('DELETE FROM Players WHERE id = ?', [id], function(err) {
            callback(err, { changes: this.changes });
        });
    }
};

module.exports = playerModel;