const { getDb } = require('../db/database');

const tournamentModel = {

    initializeEliminationTournament: async function (tournamentId) {
        const db = getDb();
        const dbRun = (sql, params) => new Promise((resolve, reject) => db.run(sql, params, function (err) { if (err) reject(err); else resolve(this); }));
        const dbGet = (sql, params) => new Promise((resolve, reject) => db.get(sql, params, (err, row) => { if (err) reject(err); else resolve(row); }));
        const dbAll = (sql, params) => new Promise((resolve, reject) => db.all(sql, params, (err, rows) => { if (err) reject(err); else resolve(rows); }));

        try {
            await dbRun("BEGIN TRANSACTION;");

            const tournament = await dbGet('SELECT * FROM tournaments WHERE id = ?', [tournamentId]);
            const players = await dbAll('SELECT p.id, p.ranking, tp.players_team_id FROM players p JOIN tournament_players tp ON p.id = tp.player_id WHERE tp.tournament_id = ?', [tournamentId]);
            const courts = await dbAll('SELECT c.id, c.name FROM courts c JOIN tournament_courts tc ON c.id = tc.court_id WHERE tc.tournament_id = ?', [tournamentId]);

            if (!tournament) throw new Error('Torneo no encontrado.');
            if (courts.length === 0) throw new Error('No hay pistas asignadas a este torneo.');
            
            const existingPairs = new Map();
            const ungroupedPlayers = [];
            players.forEach(p => {
                if (p.players_team_id) {
                    if (!existingPairs.has(p.players_team_id)) existingPairs.set(p.players_team_id, []);
                    existingPairs.get(p.players_team_id).push(p);
                } else {
                    ungroupedPlayers.push(p);
                }
            });

            if (ungroupedPlayers.length % 2 !== 0) throw new Error('Hay un número impar de jugadores sin grupo.');
            ungroupedPlayers.sort((a, b) => b.ranking - a.ranking);
            const newPairs = [];
            for (let i = 0; i < ungroupedPlayers.length; i += 2) {
                const p1 = ungroupedPlayers[i], p2 = ungroupedPlayers[i+1];
                const teamId = `${p1.id}-${p2.id}`;
                await dbRun('UPDATE tournament_players SET players_team_id = ? WHERE tournament_id = ? AND player_id IN (?, ?)', [teamId, tournamentId, p1.id, p2.id]);
                newPairs.push([p1, p2]);
            }

            const allPairs = [...existingPairs.values(), ...newPairs];
            const numPairs = allPairs.length;
            if (numPairs < 2) throw new Error('Se necesitan al menos 2 parejas para iniciar el torneo.');
            if ((numPairs & (numPairs - 1)) !== 0) throw new Error('El número de parejas debe ser una potencia de 2 (2, 4, 8, 16, etc.).');
            const numOfMatches = numPairs / 2;
            const allPhases = tournamentModel.generateBracketPhases(numOfMatches);
            //get list of matches depend of assigned courts to this tournament
            const assignedCourts = new Map();
            courts.forEach(c => assignedCourts.set(c.id, c));
            // iterate each court and assign to match
            for (const phase of allPhases) {
                const match = await dbGet('SELECT id FROM matches WHERE tournament_id = ? AND phase = ?', [tournamentId, phase]);
                if (match) {
                    const assignedCourt = Array.from(assignedCourts.values()).find(c => !c.matchId);
                    if (assignedCourt) {
                        await dbRun('UPDATE matches SET court_id = ? WHERE id = ?', [assignedCourt.id, match.id]);
                        assignedCourts.delete(assignedCourt.id);
                    }
                }
            }

            for (let i = 0; i < allPhases.length; i++) {
                const phase = allPhases[i];
                const court = courts[i % courts.length];
                await dbRun('INSERT INTO matches (tournament_id, court_id, phase) VALUES (?, ?, ?)', [tournamentId, court.id, phase]);
            }

            const firstRoundMatchCount = numOfMatches;
            const firstRoundPhases = allPhases.slice(allPhases.length - firstRoundMatchCount);

            const courtAvailability = new Map(courts.map(c => [c.id, new Date(tournament.start_date)]));
            let courtIndex = 0;

            for (let i = 0; i < firstRoundPhases.length; i++) {
                const phase = firstRoundPhases[i];
                const teamA = allPairs[i*2];
                const teamB = allPairs[i*2 + 1];
                
                const assignedCourt = courts[courtIndex];
                
                // Add this check to ensure assignedCourt is valid
                if (!assignedCourt || assignedCourt.id === undefined || assignedCourt.id === null) {
                    throw new Error('Assigned court is invalid or missing ID. This might indicate an issue with court association or an empty courts array despite checks.');
                }

                const matchStartTime = new Date(courtAvailability.get(assignedCourt.id));

                const match = await dbGet('SELECT id FROM matches WHERE tournament_id = ? AND phase = ?', [tournamentId, phase]);
                await dbRun('UPDATE matches SET court_id = ?, start_timestamp = ? WHERE id = ?', [assignedCourt.id, matchStartTime.toISOString(), match.id]);

                for (const player of teamA) await dbRun('INSERT INTO match_players (match_id, player_id, team) VALUES (?, ?, ?)', [match.id, player.id, 'A']);
                for (const player of teamB) await dbRun('INSERT INTO match_players (match_id, player_id, team) VALUES (?, ?, ?)', [match.id, player.id, 'B']);

                const nextAvailableTime = new Date(matchStartTime.getTime() + 90 * 60 * 1000);
                courtAvailability.set(assignedCourt.id, nextAvailableTime);
                courtIndex = (courtIndex + 1) % courts.length;
            }

            await dbRun('UPDATE tournaments SET status = ? WHERE id = ?', ['active', tournamentId]);
            await dbRun("COMMIT;");
            return { success: true };

        } catch (error) {
            await dbRun("ROLLBACK;");
            console.error("Error initializing tournament:", error);
            throw error;
        }
    },

    generateBracketPhases: function(numPairs) {
        // Check if numPairs is a power of 2 and at least 2
        if (numPairs < 2 || (numPairs & (numPairs - 1)) !== 0) {
            return [];
        }

        let phases = [];
        let currentLevelPhases = ['F']; // Start with the final

        // Special case for numPairs = 2, as per example
        if (numPairs === 2) {
            return ['F', 'A', 'B'];
        }

        // Add the final phase
        phases.push('F');

        // Generate phases level by level
        while (currentLevelPhases.length < numPairs) {
            let nextLevelPhases = [];
            for (const phase of currentLevelPhases) {
                if (phase === 'F') {
                    nextLevelPhases.push('A', 'B');
                } else {
                    nextLevelPhases.push(`${phase}-1`, `${phase}-2`);
                }
            }
            phases.push(...nextLevelPhases); // Append new phases
            currentLevelPhases = nextLevelPhases;
        }

        return phases;
    },

    advanceWinner: async function(tournamentId, matchId, winnerTeamId) {
        const db = getDb();
        const dbRun = (sql, params) => new Promise((resolve, reject) => db.run(sql, params, function (err) { if (err) reject(err); else resolve(this); }));
        const dbGet = (sql, params) => new Promise((resolve, reject) => db.get(sql, params, (err, row) => { if (err) reject(err); else resolve(row); }));
        const dbAll = (sql, params) => new Promise((resolve, reject) => db.all(sql, params, (err, rows) => { if (err) reject(err); else resolve(rows); }));

        try {
            const match = await dbGet('SELECT * FROM matches WHERE id = ? AND tournament_id = ?', [matchId, tournamentId]);
            if (!match || match.phase === 'F') {
                return { success: true, message: 'Final match or no winner yet.' };
            }

            let parentPhase;
            let teamSlot;

            const currentMatchPhase = match.phase.trim(); // Trim whitespace

            if (currentMatchPhase === 'F') {
                return { success: true, message: 'Final match, no further advancement.' };
            } else if (currentMatchPhase === 'A') { // Semi-final A
                parentPhase = 'F';
                teamSlot = 'A';
            } else if (currentMatchPhase === 'B') { // Semi-final B
                parentPhase = 'F';
                teamSlot = 'B';
            } else { // Other phases (Quarter-finals, etc.)
                const phaseParts = currentMatchPhase.split('-');
                const lastPart = phaseParts[phaseParts.length - 1];
                parentPhase = phaseParts.slice(0, -1).join('-');
                teamSlot = (parseInt(lastPart) % 2 !== 0) ? 'A' : 'B';
            }

            const winningPlayers = await dbAll('SELECT player_id FROM match_players WHERE match_id = ? AND team = ?', [matchId, winnerTeamId]);
            const parentMatch = await dbGet('SELECT id FROM matches WHERE tournament_id = ? AND phase = ?', [tournamentId, parentPhase]);
            
            // check if winning players has same team letter and assign opposite
            const reservedTeamSlot = await dbGet('SELECT team FROM match_players WHERE match_id = ?', [matchId])
            const oppositeTeamSlot = (reservedTeamSlot && reservedTeamSlot.team === 'A') ? 'B' : 'A';
            if (parentMatch && winningPlayers.length > 0) {
                for (const player of winningPlayers) {
                    await dbRun('INSERT INTO match_players (match_id, player_id, team) VALUES (?, ?, ?)', [parentMatch.id, player.player_id, oppositeTeamSlot]);
                }
            }
            return { success: true };
        } catch (error) {
            console.error("Error advancing winner:", error);
            throw error;
        }
    },

    associateCourtsWithTournament: (tournamentId, courtIds, callback) => {
        const db = getDb();
        const dbRun = (sql, params) => new Promise((resolve, reject) => db.run(sql, params, function (err) { if (err) reject(err); else resolve(this); }));

        db.serialize(async () => {
            try {
                await dbRun("BEGIN TRANSACTION;");

                // First, remove existing associations for this tournament
                await dbRun("DELETE FROM tournament_courts WHERE tournament_id = ?", [tournamentId]);

                // Then, insert new associations
                for (const courtId of courtIds) {
                    await dbRun("INSERT INTO tournament_courts (tournament_id, court_id) VALUES (?, ?)", [tournamentId, courtId]);
                }

                await dbRun("COMMIT;");
                callback(null, { success: true });
            } catch (error) {
                await dbRun("ROLLBACK;");
                console.error("Error associating courts with tournament:", error);
                callback(error);
            }
        });
    },

    getMatchesWithPlayersByTournament: async (tournamentId) => {
        const db = getDb();
        const dbAll = (sql, params) => new Promise((resolve, reject) => db.all(sql, params, (err, rows) => { if (err) reject(err); else resolve(rows); }));

        try {
            const matches = await dbAll('SELECT * FROM matches WHERE tournament_id = ? ORDER BY id', [tournamentId]);
            
            for (const match of matches) {
                match.players = {
                    teamA: [],
                    teamB: []
                };
                const players = await dbAll('SELECT p.*, mp.team FROM players p JOIN match_players mp ON p.id = mp.player_id WHERE mp.match_id = ?', [match.id]);
                players.forEach(player => {
                    if (player.team === 'A') {
                        match.players.teamA.push(player);
                    } else if (player.team === 'B') {
                        match.players.teamB.push(player);
                    }
                });
            }
            return matches;
        } catch (error) {
            console.error("Error getting matches with players by tournament:", error);
            throw error;
        }
    },

    getMatchById: (id, callback) => {
        const db = getDb();
        db.get('SELECT * FROM matches WHERE id = ?', [id], (err, row) => {
            callback(err, row);
        });
    },

    getTournamentById: (id, callback) => {
        const db = getDb();
        db.get('SELECT * FROM Tournaments WHERE id = ?', [id], (err, row) => {
            callback(err, row);
        });
    },

    getTournamentsByClubId: (clubId, callback) => {
        const db = getDb();
        db.all('SELECT * FROM Tournaments WHERE club_id = ?', [clubId], (err, rows) => {
            callback(err, rows);
        });
    },

    createTournament: (tournamentData, callback) => {
        const db = getDb();
        const { club_id, name, description, type, start_date, end_date } = tournamentData;
        db.run('INSERT INTO Tournaments (club_id, name, description, type, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)',
            [club_id, name, description, type, start_date, end_date],
            function(err) {
                callback(err, { id: this.lastID });
            }
        );
    },

    updateTournament: (id, name, description, type, start_date, end_date, callback) => {
        const db = getDb();
        db.run('UPDATE tournaments SET name = ?, description = ?, type = ?, start_date = ?, end_date = ? WHERE id = ?', 
            [name, description, type, start_date, end_date, id], 
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

    addPlayerToTournament: (tournamentId, playerId, callback) => {
        const db = getDb();
        const sql = "INSERT INTO tournament_players (tournament_id, player_id) VALUES (?, ?)";
        db.run(sql, [tournamentId, playerId], function(err) {
            callback(err, { lastID: this.lastID });
        });
    },

    addPlayerGroupToTournament: (tournamentId, playerIds, teamId, callback) => {
        const db = getDb();
        const sql = "INSERT INTO tournament_players (tournament_id, player_id, players_team_id) VALUES (?, ?, ?)";
        
        db.serialize(() => {
            db.run("BEGIN TRANSACTION;");

            const stmt = db.prepare(sql);
            stmt.run(tournamentId, playerIds[0], teamId);
            stmt.run(tournamentId, playerIds[1], teamId);
            stmt.finalize((err) => {
                if (err) {
                    db.run("ROLLBACK;");
                    callback(err);
                } else {
                    db.run("COMMIT;");
                    callback(null, { success: true });
                }
            });
        });
    },

    getPlayersByTournament: (tournamentId, callback) => {
        const db = getDb();
        const sql = `
            SELECT p.*, tp.players_team_id
            FROM players p
            JOIN tournament_players tp ON p.id = tp.player_id
            WHERE tp.tournament_id = ?
        `;
        db.all(sql, [tournamentId], callback);
    },

    removePlayerFromTournament: (tournamentId, playerId, callback) => {
        const db = getDb();
        const sql = "DELETE FROM tournament_players WHERE tournament_id = ? AND player_id = ?";
        db.run(sql, [tournamentId, playerId], function(err) {
            callback(err, { changes: this.changes });
        });
    },

    removePlayerGroupFromTournament: (tournamentId, teamId, callback) => {
        const db = getDb();
        const sql = "DELETE FROM tournament_players WHERE tournament_id = ? AND players_team_id = ?";
        db.run(sql, [tournamentId, teamId], function(err) {
            callback(err, { changes: this.changes });
        });
    },

    updateTournamentStatus: (id, status, callback) => {
        const db = getDb();
        db.run('UPDATE tournaments SET status = ? WHERE id = ?',
            [status, id],
            function(err) {
                if (typeof callback === 'function') {
                    callback(err, { changes: this.changes });
                }
            }
        );
    }
};

module.exports = tournamentModel;