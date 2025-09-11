const express = require('express');
const router = express.Router();

const tournamentModel = require('../models/tournamentModel');
const matchModel = require('../models/matchModel');
const playerModel = require('../models/playerModel');

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
            const player1 = await playerModel.getPlayerById(match.player1_id);
            const player2 = await playerModel.getPlayerById(match.player2_id);
            return {
                ...match,
                player1_name: player1 ? player1.name : 'N/A',
                player2_name: player2 ? player2.name : 'N/A'
            };
        }));

        res.render('public/live_dashboard', { tournament: tournament, matches: matchesWithPlayerNames });

    } catch (err) {
        console.error('Error fetching data for wallshow:', err.message);
        res.status(500).send('Error fetching data for wallshow.');
    }
});

module.exports = router;