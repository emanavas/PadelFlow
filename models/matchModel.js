const { getDb } = require('../db/database');

const matchModel = {
    createMatch: (tournament_id, player1_id, player2_id, player3_id, player4_id, score, callback) => {
        const db = getDb();
        db.run('INSERT INTO Matches (tournament_id, player1_id, player2_id, player3_id, player4_id, score) VALUES (?, ?, ?, ?, ?, ?)', 
            [tournament_id, player1_id, player2_id, player3_id, player4_id, score], 
            function(err) {
                callback(err, { id: this.lastID });
            }
        );
    },

    getMatchById: (id, callback) => {
        const db = getDb();
        db.get('SELECT * FROM Matches WHERE id = ?', [id], (err, row) => {
            callback(err, row);
        });
    },

    getMatchesByTournamentId: (tournament_id, callback) => {
        const db = getDb();
        db.all('SELECT * FROM Matches WHERE tournament_id = ?', [tournament_id], (err, rows) => {
            callback(err, rows);
        });
    },

    updateMatch: (id, score, callback) => {
        const db = getDb();
        db.run('UPDATE Matches SET score = ? WHERE id = ?', 
            [score, id], 
            function(err) {
                callback(err, { changes: this.changes });
            }
        );
    },

    deleteMatch: (id, callback) => {
        const db = getDb();
        db.run('DELETE FROM Matches WHERE id = ?', [id], function(err) {
            callback(err, { changes: this.changes });
        });
    },

    // Assumes teams is an array of teams, where each team is an array of two player_ids, e.g., [[p1, p2], [p3, p4]]
    generateRoundRobinMatches: (tournament_id, teams, callback) => {
        const db = getDb();
        const numTeams = teams.length;

        if (numTeams < 2) {
            return callback(new Error("Not enough teams to generate matches."));
        }

        const matches = [];
        for (let i = 0; i < numTeams; i++) {
            for (let j = i + 1; j < numTeams; j++) {
                const team1 = teams[i];
                const team2 = teams[j];
                matches.push({
                    tournament_id,
                    player1_id: team1[0],
                    player2_id: team1[1],
                    player3_id: team2[0],
                    player4_id: team2[1],
                    score: null
                });
            }
        }

        const stmt = db.prepare('INSERT INTO Matches (tournament_id, player1_id, player2_id, player3_id, player4_id, score) VALUES (?, ?, ?, ?, ?, ?)');
        db.serialize(() => {
            db.run('BEGIN TRANSACTION;');
            matches.forEach(match => {
                stmt.run(match.tournament_id, match.player1_id, match.player2_id, match.player3_id, match.player4_id, match.score);
            });
            db.run('COMMIT;', (err) => {
                stmt.finalize();
                callback(err, { message: `Generated ${matches.length} matches.` });
            });
        });
    },

    // Placeholder: Logic needs to be adapted for teams
    generateEliminationMatches: (tournament_id, teams, callback) => {
        console.log("generateEliminationMatches for teams needs to be implemented.");
        callback(null, { message: "Elimination match generation for teams is not yet implemented." });
    },

    advanceEliminationWinner: (match_id, winner_team, callback) => {
        const db = getDb();
        // This is a simplified placeholder. A full implementation would need to handle team advancement.
        console.log(`Team with players ${winner_team.join(' and ')} won match ${match_id}. Advancement logic needs to be implemented.`);
        callback(null, { message: `Team advanced from match ${match_id}. (Advancement logic placeholder)` });
    },

    // Placeholder: Logic needs to be adapted for teams
    generateLeagueMatches: (tournament_id, teams, callback) => {
        console.log("generateLeagueMatches for teams needs to be implemented.");
        callback(null, { message: "League match generation for teams is not yet implemented." });
    },

    assignCourtToMatch: (match_id, court_id, callback) => {
        const db = getDb();
        db.run('UPDATE Matches SET court_id = ? WHERE id = ?', 
            [court_id, match_id], 
            function(err) {
                callback(err, { changes: this.changes });
            }
        );
    }
};

module.exports = matchModel;