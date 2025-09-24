const express = require('express');
const router = express.Router();

const tournamentModel = require('../models/tournamentModel');
const matchModel = require('../models/matchModel');
const userModel = require('../models/userModel');
const tournamentPresenter = require('../presenters/tournamentPresenter');

// Ruta para cambiar el idioma
router.get('/lang/:lng', (req, res) => {
    const lng = req.params.lng;
    res.cookie('i18next', lng, { maxAge: 900000, httpOnly: true }); // Guardar preferencia en cookie
    res.redirect('back'); // Redirigir a la página anterior
});

// Ruta principal (ejemplo)
router.get('/', (req, res) => {
    res.render('main', { title: req.t('welcome') });
});

// GET route for live wallshow
router.get('/wallshow/:tournamentId', async (req, res) => {
    try {
        const tournamentId = req.params.tournamentId;

        const tournament = await tournamentModel.getTournamentById(tournamentId);
        if (!tournament) {
            return res.status(404).send('Torneo no encontrado.');
        }

        const matches = await matchModel.getMatchesByTournamentId(tournamentId);

        if (matches.length === 0) {
            return res.render('public/live_dashboard', { tournament: tournament, matches: [] });
        }

        // Fetch player names for each match concurrently
        const matchesWithPlayerNames = await Promise.all(matches.map(async (match) => {
            const user1 = await userModel.findUserById(match.user1_id);
            const user2 = await userModel.findUserById(match.user2_id);
            return {
                ...match,
                player1_name: user1 ? user1.name : 'N/A',
                player2_name: user2 ? user2.name : 'N/A'
            };
        }));

        res.render('public/live_dashboard', { tournament: tournament, matches: matchesWithPlayerNames });

    } catch (err) {
        console.error('Error fetching data for wallshow:', err.message);
        res.status(500).send('Error fetching data for wallshow.');
    }
});

// GET route for public tournament elimination view
router.get('/public/tournaments/:tournamentId/elimination', async (req, res) => {
    try {
        const tournamentId = req.params.tournamentId;

        const tournament = await tournamentModel.getTournamentById(tournamentId);
        if (!tournament) {
            return res.status(404).send('Torneo no encontrado.');
        }

        const allMatches = await tournamentModel.getMatchesWithPlayersByTournament(tournamentId);
        const registeredPlayers = await tournamentModel.getPlayersByTournament(tournamentId);
        const courts = []; // Public view doesn't need court details

        // Pass null for userId as it's a public view, so no user-specific highlights
        const viewModel = tournamentPresenter.presentTournament(tournament, allMatches, registeredPlayers, courts, req.t, null);

        res.render('public/tournament_elimination_public', {
            viewModel
        });

    } catch (err) {
        console.error('Error fetching public tournament elimination data:', err.message);
        res.status(500).send('Error fetching public tournament elimination data.');
    }
});

module.exports = router;
