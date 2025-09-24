const { dbRun, dbGet, dbAll } = require('../db/dbHelpers');

const invitationModel = {
    async createInvitation(tournamentId, invitingUserId, invitedUserId) {
        // Check if the invited user is already registered in the tournament
        const existingPlayer = await dbGet('SELECT 1 FROM tournament_players WHERE tournament_id = ? AND user_id = ?', [tournamentId, invitedUserId]);
        if (existingPlayer) {
            throw new Error('El jugador invitado ya está registrado en este torneo. Debe desinscribirse para aceptar una invitación en pareja.');
        }

        // Check if a pending invitation already exists for this user and tournament
        const existingInvitation = await dbGet(`SELECT 1 FROM tournament_invitations WHERE tournament_id = ? AND invited_user_id = ? AND status = 'pending'`, [tournamentId, invitedUserId]);
        if (existingInvitation) {
            throw new Error('Ya existe una invitación pendiente para este jugador en este torneo.');
        }

        // Check if the tournament has expired
        const tournament = await dbGet('SELECT end_date FROM tournaments WHERE id = ?', [tournamentId]);
        if (!tournament) {
            throw new Error('Torneo no encontrado.');
        }
        if (new Date(tournament.end_date) < new Date()) {
            throw new Error('El torneo ha caducado y no se pueden enviar invitaciones.');
        }

        const sql = 'INSERT INTO tournament_invitations (tournament_id, inviting_user_id, invited_user_id) VALUES (?, ?, ?)';
        return dbRun(sql, [tournamentId, invitingUserId, invitedUserId]);
    },

    async getInvitationById(id) {
        return dbGet('SELECT * FROM tournament_invitations WHERE id = ?', [id]);
    },

    async getPendingInvitationsForUser(userId) {
        const sql = `
            SELECT i.*, u.name as inviting_user_name, t.name as tournament_name
            FROM tournament_invitations i
            JOIN users u ON i.inviting_user_id = u.id
            JOIN tournaments t ON i.tournament_id = t.id
            WHERE i.invited_user_id = ? AND i.status = 'pending'
        `;
        return dbAll(sql, [userId]);
    },

    async updateInvitationStatus(id, status) {
        const sql = 'UPDATE tournament_invitations SET status = ? WHERE id = ?';
        return dbRun(sql, [status, id]);
    }
};

module.exports = invitationModel;

