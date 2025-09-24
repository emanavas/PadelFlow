const { dbRun, dbGet, dbAll } = require('../db/dbHelpers');

const clubModel = {
    async createClub(name, address, city, contact_email, contact_phone) {
        const sql = 'INSERT INTO Clubs (name, address, city, email, phone) VALUES (?, ?, ?, ?, ?)';
        return dbRun(sql, [name, address, city, contact_email, contact_phone]);
    },

    async getClubById(id) {
        return dbGet('SELECT * FROM Clubs WHERE id = ?', [id]);
    },

    async getClubPlan(clubId) {
        return dbGet('SELECT plan FROM Clubs WHERE id = ?', [clubId]);
    },

    async getClubsByActivity() {
        const sql = `
            SELECT
                C.id,
                C.name,
                COUNT(T.id) AS tournament_count
            FROM
                Clubs C
            LEFT JOIN
                Tournaments T ON C.id = T.club_id
            GROUP BY
                C.id, C.name
            ORDER BY
                tournament_count DESC
            LIMIT 10;
        `;
        return dbAll(sql);
    },

    async getCourtsByClubId(clubId) {
        try {
            return await dbAll('SELECT * FROM Courts WHERE club_id = ?', [clubId]);
        } catch (error) {
            console.error("Error getting courts by club id:", error);
            throw error;
        }
    },

    async getAllClubs() {
        return dbAll('SELECT * FROM Clubs');
    },

    async deleteClub(id) {
        return dbRun('DELETE FROM Clubs WHERE id = ?', [id]);
    }
};

module.exports = clubModel;