const { dbRun, dbGet, dbAll } = require('../db/dbHelpers');

const courtModel = {
    async getCourtsByClub(club_id) {
        try {
            return await dbAll('SELECT * FROM Courts WHERE club_id = ?', [club_id]);
        } catch (error) {
            console.error("Error getting courts by club:", error);
            throw error;
        }
    },

    async getAvailableCourtsByClub(club_id, limit) {
        let sql = "SELECT * FROM Courts WHERE club_id = ? AND status = 'available'";
        const params = [club_id];
        if (limit) {
            sql += ' LIMIT ?';
            params.push(limit);
        }
        try {
            return await dbAll(sql, params);
        } catch (error) {
            console.error("Error getting available courts by club:", error);
            throw error;
        }
    },

    async getCourtById(id) {
        try {
            return await dbGet('SELECT * FROM Courts WHERE id = ?', [id]);
        } catch (error) {
            console.error("Error getting court by id:", error);
            throw error;
        }
    },

    async updateCourtStatus(court_id, status) {
        try {
            const result = await dbRun('UPDATE Courts SET status = ? WHERE id = ?', [status, court_id]);
            return { changes: result.changes };
        } catch (error) {
            console.error("Error updating court status:", error);
            throw error;
        }
    },

    async createCourt(club_id, name) {
        const status = 'available'; // Default status for new courts
        try {
            const result = await dbRun('INSERT INTO Courts (club_id, name, status) VALUES (?, ?, ?)', [club_id, name, status]);
            return { id: result.lastID, name, status };
        } catch (error) {
            console.error("Error creating court:", error);
            throw error;
        }
    },

    async updateCourt(court_id, name, status) {
        try {
            const result = await dbRun('UPDATE Courts SET name = ?, status = ? WHERE id = ?', [name, status, court_id]);
            return { changes: result.changes };
        } catch (error) {
            console.error("Error updating court:", error);
            throw error;
        }
    },

    async deleteCourt(court_id) {
        try {
            const result = await dbRun('DELETE FROM Courts WHERE id = ?', [court_id]);
            return { changes: result.changes };
        } catch (error) {
            console.error("Error deleting court:", error);
            throw error;
        }
    },

    async getCourtsByTournament(tournamentId) {
        const sql = `
            SELECT c.* FROM Courts c
            JOIN tournament_courts tc ON c.id = tc.court_id
            WHERE tc.tournament_id = ?
        `;
        try {
            return await dbAll(sql, [tournamentId]);
        } catch (error) {
            console.error("Error getting courts by tournament:", error);
            throw error;
        }
    }
};

module.exports = courtModel;