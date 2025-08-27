const express = require('express');
const router = express.Router();
const { isAuthenticated, isClubAdmin } = require('../middlewares/authMiddleware'); // Import middleware
const playerModel = require('../models/playerModel');
const userModel = require('../models/userModel');
const tournamentModel = require('../models/tournamentModel'); // Import tournamentModel
const clubModel = require('../models/clubModel'); // Import clubModel
const bcrypt = require('bcryptjs');

// Club Admin Dashboard
router.get('/:club_id/dashboard', isAuthenticated, isClubAdmin, (req, res) => {
    const clubId = req.params.club_id;

    clubModel.getClubById(clubId, (err, club) => {
        if (err) {
            console.error('Error fetching club details:', err.message);
            return res.status(500).send('Error fetching club details.');
        }
        if (!club) {
            return res.status(404).send('Club not found.');
        }

        // Fetch other data for the dashboard if needed (e.g., tournaments, players for this club)
        tournamentModel.getTournamentsByClubId(clubId, (err, tournaments) => {
            if (err) {
                console.error('Error fetching tournaments for dashboard:', err.message);
                return res.status(500).send('Error fetching tournaments.');
            }
            playerModel.getPlayersByClubId(clubId, (err, players) => {
                if (err) {
                    console.error('Error fetching players for dashboard:', err.message);
                    return res.status(500).send('Error fetching players.');
                }
                res.render('club/dashboard', {
                    user: req.user,
                    club: club,
                    tournaments: tournaments,
                    players: players
                });
            });
        });
    });
});

// Ruta para mostrar el formulario de creación de jugador
router.get('/players/create', (req, res) => {
    res.render('club/create_player', { title: 'Crear Jugador' });
});

// Ruta para procesar la creación de jugador
router.post('/players/create', (req, res) => {
    const { name, email, password } = req.body;
    const clubId = req.session.clubId; // Assuming clubId is stored in session for club admin

    if (!clubId) {
        return res.status(400).send('Club ID not found in session.');
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err.message);
            return res.status(500).send('Error during player registration.');
        }

        userModel.createUser(email, hashedPassword, 'player', clubId, (err, userResult) => {
            if (err) {
                console.error('Error creating player user:', err.message);
                return res.status(500).send('Error during player user registration.');
            }
            const userId = userResult.id;

            playerModel.createPlayer(null, userId, name, (err, playerResult) => { // tournamentId is null initially
                if (err) {
                    console.error('Error creating player entry:', err.message);
                    return res.status(500).send('Error during player entry creation.');
                }
                console.log('Player user and entry registered:', userId, playerResult.id);
                res.redirect(`/club/${clubId}/dashboard`); // Redirect to club dashboard after creation
            });
        });
    });
});

// Ruta para mostrar todos los jugadores del club
router.get('/players', (req, res) => {
    const clubId = req.session.clubId; // Assuming clubId is stored in session

    if (!clubId) {
        return res.status(400).send('Club ID not found in session.');
    }

    playerModel.getPlayersByClubId(clubId, (err, players) => {
        if (err) {
            console.error('Error fetching players:', err.message);
            return res.status(500).send('Error fetching players.');
        }
        res.render('club/players', { title: 'Jugadores del Club', players });
    });
});

// Ruta para mostrar el formulario para añadir jugador a un torneo
router.get('/players/add-to-tournament/:id', (req, res) => {
    const playerId = req.params.id;
    const clubId = req.session.clubId; // Assuming clubId is stored in session

    if (!clubId) {
        return res.status(400).send('Club ID not found in session.');
    }

    playerModel.getPlayerById(playerId, (err, player) => {
        if (err) {
            console.error('Error fetching player:', err.message);
            return res.status(500).send('Error fetching player.');
        }
        if (!player) {
            return res.status(404).send('Player not found.');
        }

        tournamentModel.getTournamentsByClubId(clubId, (err, tournaments) => {
            if (err) {
                console.error('Error fetching tournaments:', err.message);
                return res.status(500).send('Error fetching tournaments.');
            }
            res.render('club/add_player_to_tournament', { 
                title: 'Añadir Jugador a Torneo', 
                player, 
                tournaments 
            });
        });
    });
});

// Ruta para procesar la adición de jugador a un torneo
router.post('/players/add-to-tournament', (req, res) => {
    const { playerId, tournamentId } = req.body;

    playerModel.addPlayerToTournament(playerId, tournamentId, (err, result) => {
        if (err) {
            console.error('Error adding player to tournament:', err.message);
            return res.status(500).send('Error adding player to tournament.');
        }
        console.log(`Player ${playerId} added to tournament ${tournamentId}`);
        res.redirect('/club/players'); // Redirect back to players list
    });
});

// Ruta para mostrar el formulario de edición de jugador
router.get('/players/edit/:id', (req, res) => {
    const playerId = req.params.id;

    playerModel.getPlayerById(playerId, (err, player) => {
        if (err) {
            console.error('Error fetching player:', err.message);
            return res.status(500).send('Error fetching player.');
        }
        if (!player) {
            return res.status(404).send('Player not found.');
        }
        res.render('club/edit_player', { title: 'Editar Jugador', player });
    });
});

// Ruta para procesar la edición de jugador
router.post('/players/edit/:id', (req, res) => {
    const playerId = req.params.id;
    const { name, email } = req.body;

    playerModel.updatePlayer(playerId, name, (err, result) => {
        if (err) {
            console.error('Error updating player:', err.message);
            return res.status(500).send('Error updating player.');
        }
        console.log(`Player ${playerId} updated.`);
        res.redirect('/club/players'); // Redirect back to players list
    });
});

module.exports = router;
