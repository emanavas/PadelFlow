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
    res.render('index', { title: req.t('welcome') });
});

// GET route for live wallshow
router.get('/wallshow/:tournamentId', (req, res) => {
    const tournamentId = req.params.tournamentId;

    tournamentModel.getTournamentById(tournamentId, (err, tournament) => {
        if (err) {
            console.error('Error fetching tournament for wallshow:', err.message);
            return res.status(500).send('Error fetching tournament.');
        }
        if (!tournament) {
            return res.status(404).send('Torneo no encontrado.');
        }

        matchModel.getMatchesByTournamentId(tournamentId, (err, matches) => {
            if (err) {
                console.error('Error fetching matches for wallshow:', err.message);
                return res.status(500).send('Error fetching matches.');
            }

            // Fetch player names for each match
            const matchesWithPlayerNames = [];
            let playersFetched = 0;

            if (matches.length === 0) {
                return res.render('public/live_dashboard', { tournament: tournament, matches: [] });
            }

            matches.forEach(match => {
                playerModel.getPlayerById(match.player1_id, (err, player1) => {
                    if (err) {
                        console.error('Error fetching player1 for wallshow:', err.message);
                        return res.status(500).send('Error fetching player1.');
                    }
                    playerModel.getPlayerById(match.player2_id, (err, player2) => {
                        if (err) {
                            console.error('Error fetching player2 for wallshow:', err.message);
                            return res.status(500).send('Error fetching player2.');
                        }

                        matchesWithPlayerNames.push({
                            ...match,
                            player1_name: player1 ? player1.name : 'N/A',
                            player2_name: player2 ? player2.name : 'N/A'
                        });

                        playersFetched++;
                        if (playersFetched === matches.length) {
                            res.render('public/live_dashboard', { tournament: tournament, matches: matchesWithPlayerNames });
                        }
                    });
                });
            });
        });
    });
});

module.exports = router;