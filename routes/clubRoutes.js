const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const { isAuthenticated, isClubAdmin } = require('../middlewares/authMiddleware');
const { presentTournament } = require('../presenters/tournamentPresenter');
const playerModel = require('../models/playerModel');
const tournamentModel = require('../models/tournamentModel');
const clubModel = require('../models/clubModel');
const courtModel = require('../models/courtModel');
const matchModel = require('../models/matchModel');
const { dbRun, dbGet, dbAll } = require('../db/dbHelpers');
const { calculateWinner } = require('../utils/scoring');
const { getBracketNavigation, getOppositeTeamSlot } = require('../utils/bracket');


// Club Admin Dashboard
router.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        const clubId = req.session.clubId;
        if (!clubId) {
            return res.status(400).send('Club ID not found in session.');
        }

        const club = await clubModel.getClubById(clubId);
        if (!club) {
            return res.status(404).send('Club not found.');
        }

        const tournaments = await tournamentModel.getTournamentsByClubId(clubId);
        const players = await playerModel.getPlayers();

        res.render('club/dashboard', {
            user: req.user,
            club,
            tournaments,
            players
        });
    } catch (err) {
        console.error('Error fetching dashboard data:', err.message);
        res.status(500).send('Error fetching dashboard data.');
    }
});

// Show player creation form
router.get('/players/create', isAuthenticated, isClubAdmin, async (req, res) => {
    try {
        const clubId = req.session.clubId;
        if (!clubId) {
            return res.status(400).send('Club ID not found in session.');
        }
        const club = await clubModel.getClubById(clubId);
        if (!club) {
            return res.status(404).send('Club not found.');
        }
        res.render('club/create_player', { title: 'Crear Jugador', club });
    } catch (err) {
        console.error('Error showing create player form:', err.message);
        res.status(500).send('Error showing create player form.');
    }
});

// Handle player creation
router.post('/players/create', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await playerModel.createPlayer(name, email, hashedPassword);
        res.redirect('/club/players');
    } catch (err) {
        console.error('Error creating player:', err.message);
        res.status(500).send('Error during player registration.');
    }
});

// Show all players in the club
router.get('/players', isAuthenticated, isClubAdmin, async (req, res) => {
    try {
        const clubId = req.session.clubId;
        if (!clubId) {
            return res.status(400).send('Club ID not found in session.');
        }
        const club = await clubModel.getClubById(clubId);
        if (!club) {
            return res.status(404).send('Club not found.');
        }
        const players = await playerModel.getPlayers();
        res.render('club/players', { title: 'Jugadores del Club', players, club });
    } catch (err) {
        console.error('Error fetching players:', err.message);
        res.status(500).send('Error fetching players.');
    }
});

// Show form to add player to tournament
router.get('/players/add-to-tournament/:id', async (req, res) => {
    try {
        const playerId = req.params.id;
        const clubId = req.session.clubId;
        if (!clubId) {
            return res.status(400).send('Club ID not found in session.');
        }

        const player = await playerModel.getPlayerById(playerId);
        if (!player) {
            return res.status(404).send('Player not found.');
        }

        const club = await clubModel.getClubById(clubId);
        if (!club) {
            return res.status(404).send('Club not found.');
        }

        const tournaments = await tournamentModel.getTournamentsByClubId(clubId);
        res.render('club/add_player_to_tournament', {
            title: 'Añadir Jugador a Torneo',
            player,
            tournaments,
            club
        });
    } catch (err) {
        console.error('Error showing add player to tournament form:', err.message);
        res.status(500).send('Error showing add player to tournament form.');
    }
});

// Show player edit form
router.get('/players/edit/:id', isAuthenticated, isClubAdmin, async (req, res) => {
    try {
        const playerId = req.params.id;
        const clubId = req.session.clubId;
        if (!clubId) {
            return res.status(400).send('Club ID not found in session.');
        }
        const club = await clubModel.getClubById(clubId);
        if (!club) {
            return res.status(404).send('Club not found.');
        }
        const player = await playerModel.getPlayerById(playerId);
        if (!player) {
            return res.status(404).send('Player not found.');
        }
        res.render('club/edit_player', { title: 'Editar Jugador', player, club });
    } catch (err) {
        console.error('Error showing edit player form:', err.message);
        res.status(500).send('Error showing edit player form.');
    }
});

// Handle player edit
router.post('/players/edit/:id', async (req, res) => {
    try {
        const playerId = req.params.id;
        const { name, email } = req.body;
        await playerModel.updatePlayer(playerId, name);
        console.log(`Player ${playerId} updated.`);
        res.redirect('/club/players');
    } catch (err) {
        console.error('Error updating player:', err.message);
        res.status(500).send('Error updating player.');
    }
});

// Handle court creation
router.post('/courts/create', isAuthenticated, isClubAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        const clubId = req.session.clubId;
        if (!clubId) {
            return res.status(400).send('Club ID not found in session.');
        }
        const result = await courtModel.createCourt(clubId, name);
        console.log('Court created:', result.id);
        res.status(201).json(result);
    } catch (err) {
        console.error('Error creating court:', err.message);
        res.status(500).json({ message: 'Error creating court.' });
    }
});

// Show all courts in the club
router.get('/courts', isAuthenticated, isClubAdmin, async (req, res) => {
    try {
        const clubId = req.session.clubId;
        if (!clubId) {
            return res.status(400).send('Club ID not found in session.');
        }
        const club = await clubModel.getClubById(clubId);
        if (!club) {
            return res.status(404).send('Club not found.');
        }
        const courts = await courtModel.getCourtsByClub(clubId);
        res.render('club/courts', { title: 'Pistas del Club', courts, club });
    } catch (err) {
        console.error('Error fetching courts:', err.message);
        res.status(500).send('Error fetching courts.');
    }
});

// Handle court edit
router.post('/courts/edit/:id', isAuthenticated, isClubAdmin, async (req, res) => {
    try {
        const courtId = req.params.id;
        const { name, status } = req.body;
        await courtModel.updateCourt(courtId, name, status);
        console.log(`Court ${courtId} updated.`);
        res.status(200).json({ id: courtId, name, status });
    } catch (err) {
        console.error('Error updating court:', err.message);
        res.status(500).json({ message: 'Error updating court.' });
    }
});

// Handle court deletion
router.post('/courts/delete/:id', isAuthenticated, isClubAdmin, async (req, res) => {
    try {
        const courtId = req.params.id;
        await courtModel.deleteCourt(courtId);
        console.log(`Court ${courtId} deleted.`);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error deleting court:', err.message);
        res.status(500).json({ message: 'Error deleting court.' });
    }
});

// Show tournament creation form
router.get('/tournaments/create', isAuthenticated, isClubAdmin, async (req, res) => {
    try {
        const clubId = req.session.clubId;
        if (!clubId) {
            return res.status(400).send('Club ID not found in session.');
        }
        const club = await clubModel.getClubById(clubId);
        if (!club) {
            return res.status(404).send('Club not found.');
        }
        const courts = await courtModel.getCourtsByClub(clubId);
        res.render('club/create_tournament', {
            title: 'Crear Torneo',
            club: club,
            user: req.user,
            courts: courts,
            tournament: {}
        });
    } catch (err) {
        console.error('Error showing create tournament form:', err.message);
        res.status(500).send('Error showing create tournament form.');
    }
});

// Handle tournament creation
router.post('/tournaments/create', isAuthenticated, isClubAdmin, async (req, res) => {

    try {
        const { name, description, type, startDate, startTime, endDate, endTime, courtIds, setting } = req.body;
        const clubId = req.session.clubId;

        if (!clubId) {
            return res.status(400).send('Club ID not found in session.');
        }

        const tournamentData = {
            club_id: clubId,
            name,
            description,
            type,
            start_date: `${startDate}T${startTime}`,
            end_date: `${endDate}T${endTime}`,
            setting
        };
        const result = await tournamentModel.createTournament(tournamentData);
        const tournamentId = result.id;

        if (courtIds && courtIds.length > 0) {
            // Ensure courtIds is an array, even if only one court is selected
            const selectedCourtIds = Array.isArray(courtIds) ? courtIds : [courtIds];
            await tournamentModel.associateCourtsWithTournament(tournamentId, selectedCourtIds);
        }

        res.redirect('/club/dashboard');

    } catch (err) {
        console.error('Error during tournament creation:', err.message);
        res.status(500).send('Error creating the tournament.');
    }
});

// Show page to manage a single tournament's players
router.get('/tournaments/:id/manage', isAuthenticated, isClubAdmin, async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const clubId = req.session.clubId;

        // Fetch all data concurrently
        const [tournament, registeredPlayers, availablePlayers, club] = await Promise.all([
            tournamentModel.getTournamentById(tournamentId),
            tournamentModel.getPlayersByTournament(tournamentId),
            playerModel.getPlayersNotInTournament(tournamentId),
            clubModel.getClubById(clubId)
        ]);

        if (!tournament) {
            return res.status(404).send('Tournament not found.');
        }
        // Ensure the tournament belongs to the club
        if (tournament.club_id !== clubId) {
            return res.status(403).send('Forbidden: You do not have access to this tournament.');
        }

        // Fetch courts associated with this tournament
        const courts = await courtModel.getCourtsByTournament(tournamentId);
        // Fetch matches with players/teams
        const matches = await tournamentModel.getMatchesWithPlayersByTournament(tournamentId);
        const viewModel = presentTournament(tournament, matches, registeredPlayers, courts, req.t);
        res.render('club/manage_tournament', {
            tournament,
            registeredPlayers,
            availablePlayers,
            club,
            user: req.user,
            courts,
            viewModel,
            matches
        });
    } catch (err) {
        console.error('Error getting tournament management page:', err.message);
        res.status(500).send('Error loading tournament management page.');
    }
});

// Handle adding a player to a tournament
router.post('/tournaments/:id/add_player', isAuthenticated, isClubAdmin, async (req, res) => {
    try {
        const tournamentId = req.params.id;
        // Permite recibir datos por JSON (AJAX)
        const playerId = req.body.playerId || req.body.playerId;
        if (!playerId) {
            return res.status(400).send('Player ID is required.');
        }
        await tournamentModel.addPlayerToTournament(tournamentId, playerId);
        // Si la petición es AJAX, responde con JSON
        if (req.headers['content-type'] === 'application/json') {
            return res.json({ success: true });
        }
        res.redirect(`/club/tournaments/${tournamentId}/manage`);
    } catch (err) {
        if (req.headers['content-type'] === 'application/json') {
            return res.status(500).json({ success: false });
        }
        res.status(500).send('Error adding player to tournament.');
    }
});

// Handle adding a group (2 players) to a tournament
router.post('/tournaments/:id/add_group', isAuthenticated, isClubAdmin, async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const playerIds = req.body.playerIds.map(id => parseInt(id, 10)).sort((a, b) => a - b);
        if (!Array.isArray(playerIds) || playerIds.length !== 2) {
            return res.status(400).json({ success: false, message: 'Se requieren exactamente 2 jugadores.' });
        }
        const teamId = `${playerIds[0]}-${playerIds[1]}`;
        await tournamentModel.addPlayerGroupToTournament(tournamentId, playerIds, teamId);
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error al crear el grupo.' });
    }
});

// Handle removing a player from a tournament
router.post('/tournaments/:tournament_id/remove_player/:player_id', isAuthenticated, isClubAdmin, async (req, res) => {
    try {
        const { tournament_id, player_id } = req.params;
        await tournamentModel.removePlayerFromTournament(tournament_id, player_id);
        res.redirect(`/club/tournaments/${tournament_id}/manage`);
    } catch (err) {
        console.error('Error removing player from tournament:', err.message);
        res.status(500).send('Error removing player from tournament.');
    }
});

// Handle ungrouping players from a tournament
router.post('/tournaments/:tournament_id/ungroup/:team_id', isAuthenticated, isClubAdmin, async (req, res) => {
    try {
        const { tournament_id, team_id } = req.params;
        await tournamentModel.removePlayerGroupFromTournament(tournament_id, team_id);
        res.redirect(`/club/tournaments/${tournament_id}/manage`);
    } catch (err) {
        console.error('Error ungrouping players from tournament:', err.message);
        res.status(500).send('Error ungrouping players from tournament.');
    }
});

// Show form to edit a tournament
router.get('/tournaments/:id/edit', isAuthenticated, isClubAdmin, async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const clubId = req.session.clubId;

        const [tournament, club, courts, associatedCourts] = await Promise.all([
            tournamentModel.getTournamentById(tournamentId),
            clubModel.getClubById(clubId),
            courtModel.getCourtsByClub(clubId),
            courtModel.getCourtsByTournament(tournamentId)
        ]);

        if (!tournament) {
            return res.status(404).send('Tournament not found.');
        }

        if (tournament.club_id !== clubId) {
            return res.status(403).send('Forbidden: You do not have access to this tournament.');
        }

        // Create a Set of associated court IDs for easy lookup in the template
        const associatedCourtIds = new Set(associatedCourts.map(c => c.id));

        const startDate = new Date(tournament.start_date);
        const endDate = new Date(tournament.end_date);

        res.render('club/edit_tournament', {
            tournament,
            club,
            user: req.user,
            courts,
            associatedCourtIds
        });
    } catch (err) {
        console.error('Error showing edit tournament form:', err.message);
        res.status(500).send('Error loading edit tournament form.');
    }
});

// Handle editing a tournament
router.post('/tournaments/:id/edit', isAuthenticated, isClubAdmin, async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const { name, description, type, startDate, startTime, endDate, endTime, courtIds, setting } = req.body;

        const tournamentData = {
            name,
            description,
            type,
            start_date: `${startDate}T${startTime}`,
            end_date: `${endDate}T${endTime}`,
            setting
        };

        await tournamentModel.updateTournament(tournamentId, tournamentData);

        if (courtIds) {
            const selectedCourtIds = Array.isArray(courtIds) ? courtIds : [courtIds];
            await tournamentModel.associateCourtsWithTournament(tournamentId, selectedCourtIds);
        }
        
        res.redirect(`/club/tournaments/${tournamentId}/manage`);
    } catch (err) {
        console.error('Error updating tournament:', err.message);
        res.status(500).send('Error updating tournament.');
    }
});

// Handle deleting a tournament
router.post('/tournaments/:id/delete', isAuthenticated, isClubAdmin, async (req, res) => {
    try {
        const tournamentId = req.params.id;
        
        const tournament = await tournamentModel.getTournamentById(tournamentId);
        if (!tournament || tournament.club_id !== req.session.clubId) {
            return res.status(403).send('Forbidden or tournament not found.');
        }

        await tournamentModel.deleteTournament(tournamentId);
        res.redirect('/club/dashboard');
    } catch (err) {
        console.error('Error deleting tournament:', err.message);
        res.status(500).send('Error deleting tournament.');
    }
});

// Onboarding Guide Route
router.get('/onboarding-guide', isAuthenticated, isClubAdmin, async (req, res) => {
    try {
        const clubId = req.session.clubId;
        if (!clubId) {
            return res.status(400).send('Club ID not found in session.');
        }

        const club = await clubModel.getClubById(clubId);
        if (!club) {
            return res.status(404).send('Club not found.');
        }

        res.render('club/onboarding_guide', {
            user: req.user,
            club: club
        });
    } catch (err) {
        console.error('Error fetching onboarding guide:', err.message);
        res.status(500).send('Error loading onboarding guide.');
    }
});

// Handle starting a match for a tournament
router.post('/tournaments/:id/start_match', isAuthenticated, isClubAdmin, async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const registeredPlayers = await tournamentModel.getPlayersByTournament(tournamentId);
        if (!registeredPlayers || registeredPlayers.length < 4 || registeredPlayers.length % 4 !== 0) {
            // Renderiza la vista con un banner de aviso
            const clubId = req.session.clubId;
            const [tournament, availablePlayers, club, courts] = await Promise.all([
                tournamentModel.getTournamentById(tournamentId),
                playerModel.getPlayersNotInTournament(tournamentId),
                clubModel.getClubById(clubId),
                courtModel.getCourtsByTournament(tournamentId)
            ]);
            const matches = await tournamentModel.getMatchesWithPlayersByTournament(tournamentId);
            
            const viewModel = presentTournament(tournament, matches, registeredPlayers, courts, req.t);
            return res.render('club/manage_tournament', {
                tournament,
                registeredPlayers,
                availablePlayers,
                club,
                user: req.user,
                courts,
                matches,
                viewModel,
                banner: 'No se puede iniciar el torneo: la cantidad de jugadores debe ser múltiplo de 4 y al menos 4.'
            });
        }
        await tournamentModel.updateTournamentStatus(tournamentId, 'active');
        // Generar partidos de eliminación directa (parejas aleatorias)
        await tournamentModel.generateEliminationMatches(tournamentId);
        res.redirect(`/club/tournaments/${tournamentId}/manage`);
    } catch (err) {
        res.status(500).send('Error al iniciar el torneo.');
    }
});

// AJAX endpoint to search for available players for the tournament
router.get('/tournaments/:id/search_players', isAuthenticated, isClubAdmin, async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const q = req.query.q ? req.query.q.toLowerCase() : '';
        const limit = parseInt(req.query.limit) || 0;
        let players = await playerModel.getPlayersNotInTournament(tournamentId);
        if (q) {
            players = players.filter(p => p.name.toLowerCase().includes(q));
        }
        if (limit > 0) {
            players = players.slice(0, limit);
        }
        res.json(players.map(p => ({ id: p.id, name: p.name })));
    } catch (err) {
        res.status(500).json([]);
    }
});

// Handle starting a tournament
router.post('/tournaments/:id/start', isAuthenticated, isClubAdmin, async (req, res) => {
    const tournamentId = req.params.id;
    try {
        // The new model function handles all logic, including validations
        await tournamentModel.initializeEliminationTournament(tournamentId);

        res.redirect(`/club/tournaments/${tournamentId}/manage`);

    } catch (err) {
        // If the model function throws an error, catch it and display it
        console.error(`Error starting tournament ${tournamentId}:`, err.message);
        
        // Re-fetch data needed to render the management page with an error message
        const clubId = req.session.clubId;
        const [tournament, registeredPlayers, availablePlayers, club, courts, matches] = await Promise.all([
            tournamentModel.getTournamentById(tournamentId),
            tournamentModel.getPlayersByTournament(tournamentId),
            playerModel.getPlayersNotInTournament(tournamentId),
            clubModel.getClubById(clubId),
            courtModel.getCourtsByTournament(tournamentId),
            tournamentModel.getMatchesWithPlayersByTournament(tournamentId)
        ]);

        const viewModel = presentTournament(tournament, matches, registeredPlayers, courts, req.t);
        res.render('club/manage_tournament', {
            tournament,
            registeredPlayers,
            availablePlayers,
            club,
            user: req.user,
            courts,
            matches,
            viewModel,
            mensaje: err.message, // Pass the specific error message to the view
            mensajeTipo: 'danger'
        });
    }
});

// Ruta para registrar el resultado de un partido (AJAX)
router.post('/matches/register_score', isAuthenticated, isClubAdmin, async (req, res) => {
    try {
        const { match_id, scoreData } = req.body;

        if (!match_id || !scoreData) {
            return res.status(400).json({ success: false, message: 'Faltan datos para registrar el resultado.' });
        }

        const sets = [
            { a: scoreData.score_teamA_set1, b: scoreData.score_teamB_set1 },
            { a: scoreData.score_teamA_set2, b: scoreData.score_teamB_set2 },
            { a: scoreData.score_teamA_set3, b: scoreData.score_teamB_set3 },
        ];

        const { winner: team_winner } = calculateWinner(sets);

        if (!team_winner) {
            return res.status(400).json({ success: false, message: 'El resultado no es válido para determinar un ganador.' });
        }

        // The winner advancement logic from the old handler
        const match = await dbGet('SELECT * FROM matches WHERE id = ?', [match_id]);
        if (!match) {
            return res.status(404).json({ success: false, message: 'Partido no encontrado.' });
        }
        
        const { parent: next_parent } = getBracketNavigation(match.phase);
        
        if(match.team_winner && next_parent) { // If there was a previous winner, we need to undo their advancement
            const next_match = await dbGet('SELECT * FROM matches WHERE tournament_id = ? AND phase = ?', [match.tournament_id, next_parent]);
            if (next_match) {
                await dbRun('DELETE FROM match_players WHERE match_id = ? AND winner_from = ?', [next_match.id, match.id]);
            }
        }

        // Save the new score and winner using the model function
        await matchModel.updateMatch(match_id, scoreData, team_winner);

        // Get the winning players
        const winningPlayers = await dbAll('SELECT * FROM match_players WHERE match_id = ? AND team = ? LIMIT 2', [match_id, team_winner]);

        // Advance the new winner to the next round
        if (next_parent && winningPlayers.length > 0) {
            const next_match = await dbGet('SELECT * FROM matches WHERE tournament_id = ? AND phase = ?', [match.tournament_id, next_parent]);
            if (next_match) {
                const rivals = await dbGet('SELECT * FROM match_players WHERE match_id = ?', [next_match.id]);
                for (const player of winningPlayers) {
                    await dbRun('INSERT INTO match_players (match_id, player_id, team, winner_from) VALUES (?, ?, ?, ?)', [next_match.id, player.player_id, getOppositeTeamSlot(rivals?.team), match.id]);
                }
            }
        } 
        
        res.json({ success: true, message: 'Resultado guardado correctamente.' });

    } catch (err) {
        console.error('Error al registrar el resultado:', err);
        res.status(500).json({ success: false, message: 'Error al registrar el resultado: ' + err.message });
    }
});

// Ruta para generar la siguiente ronda de eliminación directa
router.post('/tournaments/:id/next_round', isAuthenticated, isClubAdmin, async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const currentRound = parseInt(req.body.currentRound, 10);
        const result = await tournamentModel.generateNextEliminationRound(tournamentId, currentRound);
        if (result.error) {
            // Mostrar mensaje en la vista si hay partidos pendientes
            req.session.mensaje = result.error;
            req.session.mensajeTipo = 'warning';
        } else {
            req.session.mensaje = `Ronda ${currentRound + 1} generada correctamente.`;
            req.session.mensajeTipo = 'success';
        }
        res.redirect(`/club/tournaments/${tournamentId}/manage`);
    } catch (err) {
        res.status(500).send('Error al generar la siguiente ronda: ' + err.message);
    }
});

// Ruta para avanzar al ganador de un partido a la siguiente ronda
// router.post('/tournaments/:tournamentId/matches/:matchId/advance_winner', isAuthenticated, isClubAdmin, async (req, res) => {
//     try {
//         const { tournamentId, matchId } = req.params;
//         const { winnerTeamId } = req.body; // Assuming winnerTeamId is sent in the request body

//         await tournamentModel.advanceWinner(tournamentId, matchId, winnerTeamId);
//         res.json({ success: true, message: 'Winner advanced successfully.' });
//     } catch (err) {
//         console.error('Error advancing winner:', err.message);
//         res.status(500).json({ success: false, message: 'Error advancing winner.', error: err.message });
//     }
// });

// Ruta para mostrar el formulario de registro de resultados de un partido
router.get('/matches/:id/record_result', isAuthenticated, isClubAdmin, async (req, res) => {
    try {
        const matchId = req.params.id;
        const match = await tournamentModel.getMatchById(matchId);

        if (!match) {
            return res.status(404).send('Match not found.');
        }

        res.render('club/record_match_result', { match });
    } catch (err) {
        console.error('Error fetching match for result recording:', err.message);
        res.status(500).send('Error loading match result form.');
    }
});


module.exports = router;