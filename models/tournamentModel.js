const { dbRun, dbGet, dbAll } = require('../db/dbHelpers');
const { calculateWinner } = require('../utils/scoring');


/**
 * Internal helper function to parse the JSON settings of a tournament.
 * If parsing fails, it assigns default settings.
 * @param {object} tournament The tournament object with a `setting` property.
 * @returns {object} The tournament object with the `setting` property parsed as an object.
 * @private
 */
function _parseTournamentSettings(tournament) {
    if (tournament && tournament.setting) {
        try {
            tournament.setting = JSON.parse(tournament.setting);
        } catch (e) {
            console.error(`Error parsing settings for tournament ${tournament.id}:`, e);
            tournament.setting = { match_duration: 60 }; 
        }
    } else if (tournament) {
        tournament.setting = { match_duration: 60 };
    }
    return tournament;
}

const tournamentModel = {

    /**
     * Initializes an elimination-style tournament. It creates pairs, generates a bracket, 
     * creates matches for the first round, and assigns courts and start times.
     * @param {number} tournamentId The ID of the tournament to initialize.
     * @returns {Promise<{success: boolean}>} A promise that resolves to an object indicating success.
     * @throws {Error} Throws an error if the tournament is not found, has no courts, has an invalid number of players/pairs, or other setup issues.
     */
    initializeEliminationTournament: async function (tournamentId) {
        try {
            await dbRun("BEGIN TRANSACTION;");

            let tournament = await dbGet('SELECT * FROM tournaments WHERE id = ?', [tournamentId]);
            tournament = _parseTournamentSettings(tournament);

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
            const assignedCourts = new Map();
            courts.forEach(c => assignedCourts.set(c.id, c));
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
                
                if (!assignedCourt || assignedCourt.id === undefined || assignedCourt.id === null) {
                    throw new Error('Assigned court is invalid or missing ID. This might indicate an issue with court association or an empty courts array despite checks.');
                }

                const matchStartTime = new Date(courtAvailability.get(assignedCourt.id));

                const match = await dbGet('SELECT id FROM matches WHERE tournament_id = ? AND phase = ?', [tournamentId, phase]);
                await dbRun('UPDATE matches SET court_id = ?, start_timestamp = ? WHERE id = ?', [assignedCourt.id, matchStartTime.toISOString(), match.id]);

                for (const player of teamA) await dbRun('INSERT INTO match_players (match_id, player_id, team) VALUES (?, ?, ?)', [match.id, player.id, 'A']);
                for (const player of teamB) await dbRun('INSERT INTO match_players (match_id, player_id, team) VALUES (?, ?, ?)', [match.id, player.id, 'B']);

                const nextAvailableTime = new Date(matchStartTime.getTime() + (tournament.setting.match_duration || 90) * 60 * 1000);
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
        if (numPairs < 2 || (numPairs & (numPairs - 1)) !== 0) {
            return [];
        }

        let phases = [];
        let currentLevelPhases = ['F'];

        if (numPairs === 2) {
            return ['F', 'A', 'B'];
        }

        phases.push('F');

        while (currentLevelPhases.length < numPairs) {
            let nextLevelPhases = [];
            for (const phase of currentLevelPhases) {
                if (phase === 'F') {
                    nextLevelPhases.push('A', 'B');
                } else {
                    nextLevelPhases.push(`${phase}-1`, `${phase}-2`);
                }
            }
            phases.push(...nextLevelPhases);
            currentLevelPhases = nextLevelPhases;
        }

        return phases;
    },

    /**
     * Associates a list of courts with a tournament, replacing any existing associations.
     * @param {number} tournamentId The ID of the tournament.
     * @param {number[]} courtIds An array of court IDs to associate with the tournament.
     * @returns {Promise<{success: boolean}>} A promise that resolves to an object indicating success.
     * @throws {Error} Throws an error if the database transaction fails.
     */
    associateCourtsWithTournament: async function(tournamentId, courtIds) {
        try {
            await dbRun("BEGIN TRANSACTION;");
            await dbRun("DELETE FROM tournament_courts WHERE tournament_id = ?", [tournamentId]);
            for (const courtId of courtIds) {
                await dbRun("INSERT INTO tournament_courts (tournament_id, court_id) VALUES (?, ?)", [tournamentId, courtId]);
            }
            await dbRun("COMMIT;");
            return { success: true };
        } catch (error) {
            await dbRun("ROLLBACK;");
            console.error("Error associating courts with tournament:", error);
            throw error;
        }
    },

    /**
     * Retrieves all matches for a given tournament, enriching each match object with player details for team A and team B.
     * @param {number} tournamentId The ID of the tournament.
     * @returns {Promise<object[]>} A promise that resolves to an array of match objects, each with a `players` property.
     * @throws {Error} Throws an error if the database query fails.
     */
    getMatchesWithPlayersByTournament: async (tournamentId) => {
        try {
            const matches = await dbAll('SELECT * FROM matches WHERE tournament_id = ? ORDER BY id ', [tournamentId]);
            
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

    getMatchById: async function(id) {
        try {
            return await dbGet('SELECT * FROM matches WHERE id = ?', [id]);
        } catch (error) {
            console.error("Error getting match by id:", error);
            throw error;
        }
    },

    getTournamentById: async function(id) {
        try {
            let tournament = await dbGet('SELECT * FROM Tournaments WHERE id = ?', [id]);
            return _parseTournamentSettings(tournament);
        } catch (error) {
            console.error("Error getting tournament by id:", error);
            throw error;
        }
    },

    /**
     * Retrieves all tournaments associated with a specific club ID.
     * @param {number} clubId The ID of the club.
     * @returns {Promise<object[]>} A promise that resolves to an array of tournament objects.
     * @throws {Error} Throws an error if the database query fails.
     */
    getTournamentsByClubId: async function(clubId) {
        try {
            let tournaments = await dbAll('SELECT * FROM Tournaments WHERE club_id = ?', [clubId]);
            return tournaments.map(_parseTournamentSettings);
        } catch (error) {
            console.error("Error getting tournaments by club id:", error);
            throw error;
        }
    },

    /**
     * Creates a new tournament in the database.
     * @param {object} tournamentData The data for the new tournament.
     * @param {number} tournamentData.club_id The ID of the club hosting the tournament.
     * @param {string} tournamentData.name The name of the tournament.
     * @param {string} tournamentData.description A description of the tournament.
     * @param {string} tournamentData.type The type of tournament (e.g., 'eliminacion', 'americana').
     * @param {string} tournamentData.start_date The start date of the tournament (YYYY-MM-DD).
     * @param {string} tournamentData.end_date The end date of the tournament (YYYY-MM-DD).
     * @param {object} [tournamentData.setting] Optional JSON settings for the tournament.
     * @returns {Promise<{id: number}>} A promise that resolves to an object containing the ID of the new tournament.
     * @throws {Error} Throws an error if the database insert fails.
     */
    createTournament: async function(tournamentData) {
        const { club_id, name, description, type, start_date, end_date, setting } = tournamentData;
        const settingJSON = JSON.stringify(setting || { match_duration: 60 });
        try {
            const result = await dbRun('INSERT INTO Tournaments (club_id, name, description, type, start_date, end_date, setting) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [club_id, name, description, type, start_date, end_date, settingJSON]);
            return { id: result.lastID };
        } catch (error) {
            console.error("Error creating tournament:", error);
            throw error;
        }
    },

    updateTournament: async function(id, tournamentData) {
        const { name, description, type, start_date, end_date, setting } = tournamentData;
        const settingJSON = JSON.stringify(setting);
        try {
            const result = await dbRun('UPDATE Tournaments SET name = ?, description = ?, type = ?, start_date = ?, end_date = ?, setting = ? WHERE id = ?', 
                [name, description, type, start_date, end_date, settingJSON, id]);
            return { changes: result.changes };
        } catch (error) {
            console.error("Error updating tournament:", error);
            throw error;
        }
    },

    deleteTournament: async function(id) {
        try {
            const result = await dbRun('DELETE FROM Tournaments WHERE id = ?', [id]);
            return { changes: result.changes };
        } catch (error) {
            console.error("Error deleting tournament:", error);
            throw error;
        }
    },

    addPlayerToTournament: async function(tournamentId, playerId) {
        const sql = "INSERT INTO tournament_players (tournament_id, player_id) VALUES (?, ?)";
        try {
            const result = await dbRun(sql, [tournamentId, playerId]);
            return { lastID: result.lastID };
        } catch (error) {
            console.error("Error adding player to tournament:", error);
            throw error;
        }
    },

    addPlayerGroupToTournament: async function(tournamentId, playerIds, teamId) {
        const sql = "INSERT INTO tournament_players (tournament_id, player_id, players_team_id) VALUES (?, ?, ?)";
        try {
            await dbRun("BEGIN TRANSACTION;");
            await dbRun(sql, [tournamentId, playerIds[0], teamId]);
            await dbRun(sql, [tournamentId, playerIds[1], teamId]);
            await dbRun("COMMIT;");
            return { success: true };
        } catch (error) {
            await dbRun("ROLLBACK;");
            console.error("Error adding player group to tournament:", error);
            throw error;
        }
    },

    getPlayersByTournament: async function(tournamentId) {
        const sql = `
            SELECT p.*, tp.players_team_id
            FROM players p
            JOIN tournament_players tp ON p.id = tp.player_id
            WHERE tp.tournament_id = ?
        `;
        try {
            return await dbAll(sql, [tournamentId]);
        } catch (error) {
            console.error("Error getting players by tournament:", error);
            throw error;
        }
    },

    removePlayerFromTournament: async function(tournamentId, playerId) {
        const sql = "DELETE FROM tournament_players WHERE tournament_id = ? AND player_id = ?";
        try {
            const result = await dbRun(sql, [tournamentId, playerId]);
            return { changes: result.changes };
        } catch (error) {
            console.error("Error removing player from tournament:", error);
            throw error;
        }
    },

    removePlayerGroupFromTournament: async function(tournamentId, teamId) {
        const sql = "DELETE FROM tournament_players WHERE tournament_id = ? AND players_team_id = ?";
        try {
            const result = await dbRun(sql, [tournamentId, teamId]);
            return { changes: result.changes };
        } catch (error) {
            console.error("Error removing player group from tournament:", error);
            throw error;
        }
    },

    updateTournamentStatus: async function(id, status) {
        try {
            const result = await dbRun('UPDATE tournaments SET status = ? WHERE id = ?', [status, id]);
            return { changes: result.changes };
        } catch (error) {
            console.error("Error updating tournament status:", error);
            throw error;
        }
    },

};

module.exports = tournamentModel;