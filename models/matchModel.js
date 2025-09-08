const { dbRun, dbGet, dbAll } = require('../db/dbHelpers');

const matchModel = {
    async createMatch(tournament_id, phase, court_id) {
        const sql = 'INSERT INTO matches (tournament_id, phase, court_id) VALUES (?, ?, ?)';
        const result = await dbRun(sql, [tournament_id, phase, court_id]);
        return result.lastID;
    },

    async addPlayersToMatch(matchId, playersWithTeams) {
        try {
            await dbRun('BEGIN TRANSACTION;');
            for (const player of playersWithTeams) {
                await dbRun('INSERT INTO match_players (match_id, player_id, team) VALUES (?, ?, ?)', [matchId, player.id, player.team]);
            }
            await dbRun('COMMIT;');
            return { message: `Added ${playersWithTeams.length} players to match ${matchId}.` };
        } catch (error) {
            await dbRun('ROLLBACK;');
            console.error("Error adding players to match:", error);
            throw error;
        }
    },

    async getMatchById(id) {
        const sql = `
            SELECT
                m.*,
                c.name as court_name,
                GROUP_CONCAT(CASE WHEN mp.team = 'A' THEN p.name END) AS team_a_players,
                GROUP_CONCAT(CASE WHEN mp.team = 'B' THEN p.name END) AS team_b_players,
                GROUP_CONCAT(CASE WHEN mp.team = 'A' THEN p.id END) AS team_a_player_ids,
                GROUP_CONCAT(CASE WHEN mp.team = 'B' THEN p.id END) AS team_b_player_ids
            FROM matches m
            LEFT JOIN match_players mp ON m.id = mp.match_id
            LEFT JOIN players p ON mp.player_id = p.id
            LEFT JOIN courts c ON m.court_id = c.id
            WHERE m.id = ?
            GROUP BY m.id
        `;
        return dbGet(sql, [id]);
    },

    async getMatchesByTournamentId(tournament_id) {
        const sql = `
            SELECT
                m.*,
                c.name as court_name,
                GROUP_CONCAT(CASE WHEN mp.team = 'A' THEN p.name END) AS team_a_players,
                GROUP_CONCAT(CASE WHEN mp.team = 'B' THEN p.name END) AS team_b_players,
                GROUP_CONCAT(CASE WHEN mp.team = 'A' THEN p.id END) AS team_a_player_ids,
                GROUP_CONCAT(CASE WHEN mp.team = 'B' THEN p.id END) AS team_b_player_ids
            FROM matches m
            LEFT JOIN match_players mp ON m.id = mp.match_id
            LEFT JOIN players p ON mp.player_id = p.id
            LEFT JOIN courts c ON m.court_id = c.id
            WHERE m.tournament_id = ?
            GROUP BY m.id
            ORDER BY m.phase, m.id
        `;
        return dbAll(sql, [tournament_id]);
    },

    async updateMatch(id, scoreData, team_winner) {
        const sql = `UPDATE matches SET 
                        score_teamA_set1 = ?, score_teamB_set1 = ?,
                        score_teamA_set2 = ?, score_teamB_set2 = ?,
                        score_teamA_set3 = ?, score_teamB_set3 = ?,
                        team_winner = ?, end_timestamp = CURRENT_TIMESTAMP
                    WHERE id = ?`;
        
        const params = [
            scoreData.score_teamA_set1, scoreData.score_teamB_set1,
            scoreData.score_teamA_set2, scoreData.score_teamB_set2,
            scoreData.score_teamA_set3, scoreData.score_teamB_set3,
            team_winner,
            id
        ];

        return dbRun(sql, params);
    },

    async deleteMatch(id) {
        return dbRun('DELETE FROM matches WHERE id = ?', [id]);
    },

    async assignCourtToMatch(match_id, court_id) {
        const sql = 'UPDATE matches SET court_id = ? WHERE id = ?';
        return dbRun(sql, [court_id, match_id]);
    }
};

module.exports = matchModel;