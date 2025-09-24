const { dbRun, dbGet, dbAll } = require('../db/dbHelpers');

const userModel = {
    async createUser(name, email, password, role, club_id, options = '{}') {
        const sql = 'INSERT INTO Users (name, email, password, role, club_id, options) VALUES (?, ?, ?, ?, ?, ?)';
        return dbRun(sql, [name, email, password, role, club_id, options]);
    },

    async findUserByEmail(email) {
        return dbGet('SELECT * FROM Users WHERE email = ?', [email]);
    },

    async findUserById(id) {
        return dbGet('SELECT * FROM Users WHERE id = ?', [id]);
    },

    async getAllUsers() {
        const sql = 'SELECT U.*, C.name AS club_name FROM Users U LEFT JOIN Clubs C ON U.club_id = C.id';
        return dbAll(sql);
    },

    async getUsersByRole(role) {
        return dbAll('SELECT * FROM Users WHERE role = ?', [role]);
    },

    async getUsersNotInTournament(tournamentId) {
        const sql = `
            SELECT u.*
            FROM users u
            WHERE u.role = 'player' AND u.id NOT IN (SELECT tp.user_id FROM tournament_players tp WHERE tp.tournament_id = ?)
        `;
        return dbAll(sql, [tournamentId]);
    },

    async updateUser(id, fields) {
        const updates = [];
        const params = [];

        for (const key in fields) {
            if (fields[key] !== undefined) {
                updates.push(`${key} = ?`);
                params.push(fields[key]);
            }
        }

        if (updates.length === 0) {
            return { changes: 0 };
        }

        params.push(id);
        const sql = `UPDATE Users SET ${updates.join(', ')} WHERE id = ?`;
        return dbRun(sql, params);
    },

    async deleteUser(id) {
        return dbRun('DELETE FROM Users WHERE id = ?', [id]);
    },

    async getUserStats(userId) {
        const partidosJugadosSql = `SELECT COUNT(*) as count FROM match_players WHERE user_id = ?`;
        const victoriasSql = `
            SELECT COUNT(*) as count
            FROM match_players mp
            JOIN matches m ON mp.match_id = m.id
            WHERE mp.user_id = ? AND mp.team = m.team_winner
        `;

        try {
            const partidosJugadosResult = await dbGet(partidosJugadosSql, [userId]);
            const victoriasResult = await dbGet(victoriasSql, [userId]);

            const partidosJugados = partidosJugadosResult.count;
            const victorias = victoriasResult.count;
            const efectividad = partidosJugados > 0 ? ((victorias / partidosJugados) * 100).toFixed(0) + '%' : '0%';

            return {
                partidosJugados,
                victorias,
                efectividad
            };
        } catch (error) {
            console.error("Error getting user stats:", error);
            throw error;
        }
    },

    async getNextMatchForUser(userId) {
        const sql = `
            SELECT m.*
            FROM matches m
            JOIN match_players mp ON m.id = mp.match_id
            WHERE mp.user_id = ? AND m.start_timestamp > DATETIME('now')
            ORDER BY m.start_timestamp ASC
            LIMIT 1
        `;
        try {
            return await dbGet(sql, [userId]);
        } catch (error) {
            console.error("Error getting next match for user:", error);
            throw error;
        }
    }
};

module.exports = userModel;