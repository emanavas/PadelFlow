const { getDb } = require('../db/database');

const matchModel = {
    // Creates a match record without players. Players are linked via match_players table.
    createMatch: (tournament_id, phase, court_id, callback) => {
        const db = getDb();
        // Removed player_id columns from INSERT statement
        db.run('INSERT INTO matches (tournament_id, phase, court_id) VALUES (?, ?, ?)',
            [tournament_id, phase, court_id],
            function(err) {
                callback(err, { id: this.lastID });
            }
        );
    },

    // Links players to a specific match in the match_players table
    addPlayersToMatch: (matchId, playersWithTeams, callback) => {
        const db = getDb();
        const stmt = db.prepare('INSERT INTO match_players (match_id, player_id, team) VALUES (?, ?, ?)');
        db.serialize(() => {
            db.run('BEGIN TRANSACTION;');
            playersWithTeams.forEach(player => {
                stmt.run(matchId, player.id, player.team);
            });
            db.run('COMMIT;', (err) => {
                stmt.finalize();
                callback(err, { message: `Added ${playersWithTeams.length} players to match ${matchId}.` });
            });
        });
    },

    getMatchById: (id, callback) => {
        const db = getDb();
        // Join with match_players and players to get player details
        const sql = `
            SELECT
                m.*,
                GROUP_CONCAT(CASE WHEN mp.team = 'A' THEN p.name END) AS team_a_players,
                GROUP_CONCAT(CASE WHEN mp.team = 'B' THEN p.name END) AS team_b_players,
                GROUP_CONCAT(CASE WHEN mp.team = 'A' THEN p.id END) AS team_a_player_ids,
                GROUP_CONCAT(CASE WHEN mp.team = 'B' THEN p.id END) AS team_b_player_ids
            FROM matches m
            LEFT JOIN match_players mp ON m.id = mp.match_id
            LEFT JOIN players p ON mp.player_id = p.id
            WHERE m.id = ?
            GROUP BY m.id
        `;
        db.get(sql, [id], callback);
    },

    getMatchesByTournamentId: (tournament_id, callback) => {
        const db = getDb();
        // Join with match_players and players to get player details for all matches
        const sql = `
            SELECT
                m.*,
                GROUP_CONCAT(CASE WHEN mp.team = 'A' THEN p.name END) AS team_a_players,
                GROUP_CONCAT(CASE WHEN mp.team = 'B' THEN p.name END) AS team_b_players,
                GROUP_CONCAT(CASE WHEN mp.team = 'A' THEN p.id END) AS team_a_player_ids,
                GROUP_CONCAT(CASE WHEN mp.team = 'B' THEN p.id END) AS team_b_player_ids
            FROM matches m
            LEFT JOIN match_players mp ON m.id = mp.match_id
            LEFT JOIN players p ON mp.player_id = p.id
            WHERE m.tournament_id = ?
            GROUP BY m.id
            ORDER BY m.phase, m.id
        `;
        db.all(sql, [tournament_id], callback);
    },

    updateMatch: (id, score, team_winner, callback) => { // Added team_winner
        const db = getDb();
        db.run('UPDATE matches SET score = ?, team_winner = ? WHERE id = ?', // Updated table name to 'matches'
            [score, team_winner, id],
            function(err) {
                callback(err, { changes: this.changes });
            }
        );
    },

    deleteMatch: (id, callback) => {
        const db = getDb();
        db.run('DELETE FROM matches WHERE id = ?', [id], function(err) { // Updated table name to 'matches'
            callback(err, { changes: this.changes });
        });
    },

    assignCourtToMatch: (match_id, court_id, callback) => {
        const db = getDb();
        db.run('UPDATE matches SET court_id = ? WHERE id = ?', // Updated table name to 'matches'
            [court_id, match_id],
            function(err) {
                callback(err, { changes: this.changes });
            }
        );
    }
};

module.exports = matchModel;