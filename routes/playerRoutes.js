const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/authMiddleware');
const userModel = require('../models/userModel');
const tournamentModel = require('../models/tournamentModel');
const invitationModel = require('../models/invitationModel');
const matchModel = require('../models/matchModel');
const tournamentPresenter = require('../presenters/tournamentPresenter');

// Player Dashboard
router.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.userId;

        const stats = await userModel.getUserStats(userId);
        const nextMatch = await userModel.getNextMatchForUser(userId);
        const availableTournaments = await tournamentModel.getAvailableTournamentsForPlayer(userId);
        const myTournaments = await tournamentModel.getTournamentsByPlayer(userId);
        const pendingInvitations = await invitationModel.getPendingInvitationsForUser(userId);

        res.render('player/dashboard', {
            user: req.session.user,
            stats: {
                ...stats,
                proximoPartido: nextMatch ? new Date(nextMatch.start_timestamp).toLocaleString() : 'No hay próximos partidos'
            },
            availableTournaments,
            myTournaments,
            pendingInvitations
        });
    } catch (err) {
        console.error('Error fetching player dashboard data:', err.message);
        res.status(500).send('Error fetching player dashboard data.');
    }
});

// Invite a player to a tournament
router.post('/tournaments/:id/invite', isAuthenticated, async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const invitingUserId = req.session.userId;
        const { invitedUserId } = req.body;

        await invitationModel.createInvitation(tournamentId, invitingUserId, invitedUserId);

        res.json({ success: true, message: 'Invitación enviada con éxito!' });
    } catch (err) {
        console.error('Error creating invitation:', err.message);
        res.status(500).json({ success: false, message: 'Error al enviar la invitación: '+err.message });
    }
});

// Accept an invitation
router.post('/invitations/:id/accept', isAuthenticated, async (req, res) => {
    try {
        const invitationId = req.params.id;
        const invitation = await invitationModel.getInvitationById(invitationId);

        if (!invitation || invitation.invited_user_id !== req.session.userId) {
            return res.status(403).send('Forbidden');
        }

        await invitationModel.updateInvitationStatus(invitationId, 'accepted');

        const userIds = [invitation.inviting_user_id, invitation.invited_user_id].sort((a, b) => a - b);
        const teamId = userIds.join('-');

        await tournamentModel.addPlayerGroupToTournament(invitation.tournament_id, userIds, teamId);

        res.redirect('/player/dashboard');
    } catch (err) {
        console.error('Error accepting invitation:', err.message);
        res.status(500).send('Error accepting invitation.');
    }
});

// Decline an invitation
router.post('/invitations/:id/decline', isAuthenticated, async (req, res) => {
    try {
        const invitationId = req.params.id;
        const invitation = await invitationModel.getInvitationById(invitationId);

        if (!invitation || invitation.invited_user_id !== req.session.userId) {
            return res.status(403).send('Forbidden');
        }

        await invitationModel.updateInvitationStatus(invitationId, 'declined');

        res.redirect('/player/dashboard');
    } catch (err) {
        console.error('Error declining invitation:', err.message);
        res.status(500).send('Error declining invitation.');
    }
});


// Enroll a player in a tournament alone
router.post('/tournaments/:id/enroll-alone', isAuthenticated, async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const userId = req.session.userId;

        await tournamentModel.addPlayerToTournament(tournamentId, userId);
        res.json({ success: true, message: 'Inscripción exitosa.' });
    } catch (err) {
        console.error('Error enrolling player alone in tournament:', err.message);
        res.status(500).json({ success: false, message: 'Error al inscribirse en el torneo.' });
    }
});

// View a tournament
router.get('/tournaments/:id', isAuthenticated, async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const userId = req.session.userId;

        const tournament = await tournamentModel.getTournamentById(tournamentId);
        const allMatches = await tournamentModel.getMatchesWithPlayersByTournament(tournamentId);
        const registeredPlayers = await tournamentModel.getPlayersByTournament(tournamentId);
        const courts = []; // Assuming no court info is needed for player view for now

        const viewModel = tournamentPresenter.presentTournament(tournament, allMatches, registeredPlayers, courts, req.t, userId);

        const myMatches = await matchModel.getMatchesByTournamentAndPlayer(tournamentId, userId);

        if (viewModel.view.isElimination) {
            res.render('player/tournament_elimination', {
                user: req.session.user,
                viewModel,
                myMatches
            });
        } else {
            res.render('player/tournament', {
                user: req.session.user,
                viewModel,
                myMatches
            });
        }
    } catch (err) {
        console.error('Error fetching tournament data:', err.message);
        res.status(500).send('Error fetching tournament data.');
    }
});

module.exports = router;