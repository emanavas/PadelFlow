const { dbRun, dbGet, dbAll } = require('../db/dbHelpers');

const playerModel = {
    async createPlayer(name, email, password) {
        const sql = 'INSERT INTO Players (name, email, password) VALUES (?, ?, ?)';
        return dbRun(sql, [name, email, password]);
    },

    async getPlayerById(id) {
        return dbGet('SELECT * FROM Players WHERE id = ?', [id]);
    },

    async getPlayers() {
        return dbAll('SELECT * FROM Players');
    },

    async getPlayersNotInTournament(tournamentId) {
        const sql = `
            SELECT p.*
            FROM players p
            LEFT JOIN tournament_players tp ON p.id = tp.player_id AND tp.tournament_id = ?
            WHERE tp.player_id IS NULL
        `;
        return dbAll(sql, [tournamentId]);
    },

    async updatePlayer(id, name) {
        const sql = 'UPDATE Players SET name = ? WHERE id = ?';
        return dbRun(sql, [name, id]);
    },

    async deletePlayer(id) {
        return dbRun('DELETE FROM Players WHERE id = ?', [id]);
    }
};

module.exports = playerModel;
