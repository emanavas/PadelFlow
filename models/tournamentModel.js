const { getDb } = require('../db/database');

const tournamentModel = {
    createTournament: (club_id, name, type, start_date, end_date, callback) => {
        const db = getDb();
        db.run('INSERT INTO Tournaments (club_id, name, type, start_date, end_date) VALUES (?, ?, ?, ?, ?)', 
            [club_id, name, type, start_date, end_date], 
            function(err) {
                callback(err, { id: this.lastID });
            }
        );
    },

    getTournamentById: (id, callback) => {
        const db = getDb();
        db.get('SELECT * FROM Tournaments WHERE id = ?', [id], (err, row) => {
            callback(err, row);
        });
    },

    getTournamentsByClubId: (club_id, callback) => {
        const db = getDb();
        db.all('SELECT * FROM Tournaments WHERE club_id = ?', [club_id], (err, rows) => {
            callback(err, rows);
        });
    },

    countActiveTournaments: (clubId, callback) => {
        const db = getDb();
        const today = new Date().toISOString().split('T')[0];
        db.get('SELECT COUNT(*) as count FROM Tournaments WHERE club_id = ? AND end_date >= ?', [clubId, today], (err, row) => {
            callback(err, row);
        });
    },

    updateTournament: (id, name, type, start_date, end_date, callback) => {
        const db = getDb();
        db.run('UPDATE Tournaments SET name = ?, type = ?, start_date = ?, end_date = ? WHERE id = ?', 
            [name, type, start_date, end_date, id], 
            function(err) {
                callback(err, { changes: this.changes });
            }
        );
    },

    deleteTournament: (id, callback) => {
        const db = getDb();
        db.run('DELETE FROM Tournaments WHERE id = ?', [id], function(err) {
            callback(err, { changes: this.changes });
        });
    },

    getRoundRobinStandings: (tournament_id, callback) => {
        const db = getDb();
        const standings = {}; // { playerId: { name, wins, losses, setsWon, setsLost, gamesWon, gamesLost } }

        // Helper to parse score and determine winner
        const parseScore = (score) => {
            if (!score) return null;
            const sets = score.split(',').map(s => s.trim());
            let player1Sets = 0;
            let player2Sets = 0;
            let player1Games = 0;
            let player2Games = 0;

            for (const set of sets) {
                const [s1, s2] = set.split('-').map(Number);
                if (s1 > s2) {
                    player1Sets++;
                } else if (s2 > s1) {
                    player2Sets++;
                }
                player1Games += s1;
                player2Games += s2;
            }
            return { player1Sets, player2Sets, player1Games, player2Games };
        };

        // 1. Get all players in the tournament
        db.all('SELECT id, name FROM Players WHERE tournament_id = ?', [tournament_id], (err, players) => {
            if (err) return callback(err);

            players.forEach(p => {
                standings[p.id] = {
                    id: p.id,
                    name: p.name,
                    wins: 0,
                    losses: 0,
                    setsWon: 0,
                    setsLost: 0,
                    gamesWon: 0,
                    gamesLost: 0
                };
            });

            // 2. Get all matches for the tournament
            db.all('SELECT * FROM Matches WHERE tournament_id = ? AND score IS NOT NULL', [tournament_id], (err, matches) => {
                if (err) return callback(err);

                matches.forEach(match => {
                    const result = parseScore(match.score);
                    if (!result) return;

                    const p1 = standings[match.player1_id];
                    const p2 = standings[match.player2_id];

                    if (!p1 || !p2) return; // Should not happen if players are correctly linked

                    // Update sets and games
                    p1.setsWon += result.player1Sets;
                    p1.setsLost += result.player2Sets;
                    p1.gamesWon += result.player1Games;
                    p1.gamesLost += result.player2Games;

                    p2.setsWon += result.player2Sets;
                    p2.setsLost += result.player1Sets;
                    p2.gamesWon += result.player2Games;
                    p2.gamesLost += result.player1Games;

                    // Determine match winner
                    if (result.player1Sets > result.player2Sets) {
                        p1.wins++;
                        p2.losses++;
                    } else if (result.player2Sets > result.player1Sets) {
                        p2.wins++;
                        p1.losses++;
                    }
                    // No handling for draws in sets, assuming one player wins more sets
                });

                // Convert standings object to array and sort
                const sortedStandings = Object.values(standings).sort((a, b) => {
                    // Primary sort: Wins (descending)
                    if (b.wins !== a.wins) return b.wins - a.wins;
                    // Secondary sort: Set difference (descending)
                    const aSetDiff = a.setsWon - a.setsLost;
                    const bSetDiff = b.setsWon - b.setsLost;
                    if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;
                    // Tertiary sort: Game difference (descending)
                    const aGameDiff = a.gamesWon - a.gamesLost;
                    const bGameDiff = b.gamesWon - b.gamesLost;
                    return bGameDiff - aGameDiff;
                });

                callback(null, sortedStandings);
            });
        });
    },

    getRoundRobinWinner: (tournament_id, callback) => {
        tournamentModel.getRoundRobinStandings(tournament_id, (err, standings) => {
            if (err) return callback(err);
            if (standings.length > 0) {
                callback(null, standings[0]); // The winner is the first player in the sorted standings
            } else {
                callback(null, null); // No standings, no winner
            }
        });
    },

    getEliminationChampion: (tournament_id, callback) => {
        const db = getDb();
        // Get all matches for the tournament
        db.all('SELECT * FROM Matches WHERE tournament_id = ? AND score IS NOT NULL', [tournament_id], (err, matches) => {
            if (err) return callback(err);
            if (matches.length === 0) return callback(null, null); // No matches played yet

            // Find the "final" match. This is a simplification.
            // In a real elimination bracket, you'd track rounds and find the match in the last round.
            // For now, we'll assume the match with a score and no subsequent matches is the final.
            // Or, more simply, the match with the highest ID among completed matches.
            const finalMatch = matches.reduce((prev, current) => (prev.id > current.id) ? prev : current);

            if (!finalMatch || !finalMatch.score) return callback(null, null); // Final match not found or not scored

            const parseScore = (score) => {
                if (!score) return null;
                const sets = score.split(',').map(s => s.trim());
                let player1Sets = 0;
                let player2Sets = 0;

                for (const set of sets) {
                    const [s1, s2] = set.split('-').map(Number);
                    if (s1 > s2) {
                        player1Sets++;
                    } else if (s2 > s1) {
                        player2Sets++;
                    }
                }
                return { player1Sets, player2Sets };
            };

            const result = parseScore(finalMatch.score);
            if (!result) return callback(null, null);

            let championId = null;
            if (result.player1Sets > result.player2Sets) {
                championId = finalMatch.player1_id;
            } else if (result.player2Sets > result.player1Sets) {
                championId = finalMatch.player2_id;
            }

            if (championId) {
                // Fetch champion's name
                db.get('SELECT id, name FROM Players WHERE id = ?', [championId], (err, champion) => {
                    if (err) return callback(err);
                    callback(null, champion);
                });
            } else {
                callback(null, null); // No clear winner from the final match
            }
        });
    },

    getAmericanaStandings: (tournament_id, callback) => {
        const db = getDb();
        const standings = {}; // { playerId: { name, gamesWon } }

        // Helper to parse score and extract games won by each player in a match
        const parseAmericanaScore = (score) => {
            if (!score) return null;
            const sets = score.split(',').map(s => s.trim());
            let player1Games = 0;
            let player2Games = 0;

            for (const set of sets) {
                const [s1, s2] = set.split('-').map(Number);
                player1Games += s1;
                player2Games += s2;
            }
            return { player1Games, player2Games };
        };

        // 1. Get all players in the tournament
        db.all('SELECT id, name FROM Players WHERE tournament_id = ?', [tournament_id], (err, players) => {
            if (err) return callback(err);

            players.forEach(p => {
                standings[p.id] = {
                    id: p.id,
                    name: p.name,
                    gamesWon: 0
                };
            });

            // 2. Get all matches for the tournament
            db.all('SELECT * FROM Matches WHERE tournament_id = ? AND score IS NOT NULL', [tournament_id], (err, matches) => {
                if (err) return callback(err);

                matches.forEach(match => {
                    const result = parseAmericanaScore(match.score);
                    if (!result) return;

                    const p1 = standings[match.player1_id];
                    const p2 = standings[match.player2_id];

                    if (!p1 || !p2) return; // Should not happen if players are correctly linked

                    // Update games won for each player
                    p1.gamesWon += result.player1Games;
                    p2.gamesWon += result.player2Games;
                });

                // Convert standings object to array and sort by gamesWon (descending)
                const sortedStandings = Object.values(standings).sort((a, b) => b.gamesWon - a.gamesWon);

                callback(null, sortedStandings);
            });
        });
    },

    getAmericanaWinner: (tournament_id, callback) => {
        tournamentModel.getAmericanaStandings(tournament_id, (err, standings) => {
            if (err) return callback(err);
            if (standings.length > 0) {
                callback(null, standings[0]); // The winner is the first player in the sorted standings
            } else {
                callback(null, null); // No standings, no winner
            }
        });
    }
};

module.exports = tournamentModel;