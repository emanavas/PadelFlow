const { getDb } = require('../db/database');

const playerModel = {
    createPlayer: (name, email, password, callback) => {
        const db = getDb();
        db.run('INSERT INTO Players (name, email, password) VALUES (?, ?, ?)', 
            [name, email, password], 
            function(err) {
                callback(err, { id: this.lastID, name, email });
            }
        );
    },

    getPlayerById: (id, callback) => {
        const db = getDb();
        db.get('SELECT * FROM Players WHERE id = ?', [id], (err, row) => {
            callback(err, row);
        });
    },

    getPlayers: (callback) => {
        const db = getDb();
        db.all('SELECT * FROM Players', [], (err, rows) => {
            callback(err, rows);
        });
    },

    getPlayersNotInTournament: (tournamentId, callback) => {
        const db = getDb();
        const sql = `
            SELECT p.*
            FROM players p
            LEFT JOIN tournament_players tp ON p.id = tp.player_id AND tp.tournament_id = ?
            WHERE tp.player_id IS NULL
        `;
        db.all(sql, [tournamentId], callback);
    },

    updatePlayer: (id, name, callback) => {
        const db = getDb();
        db.run('UPDATE Players SET name = ? WHERE id = ?', 
            [name, id], 
            function(err) {
                callback(err, { id, name });
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