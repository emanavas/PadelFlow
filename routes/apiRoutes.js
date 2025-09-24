const express = require('express');
const router = express.Router();
const userModel = require('../models/userModel');
const tournamentModel = require('../models/tournamentModel');
const clubModel = require('../models/clubModel');
const tournamentPresenter = require('../presenters/tournamentPresenter');

let clients = {}; // Stores SSE connections

// GET /api/events/:id - SSE endpoint for real-time updates
router.get('/api/events/:id', (req, res) => {
    const tournamentId = req.params.id;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Initialize clients object for this tournament if it doesn't exist
    if (!clients[tournamentId]) {
        clients[tournamentId] = [];
    }

    // Add this client to the list for the specific tournament
    clients[tournamentId].push(res);

    console.log(`Client connected to SSE for tournament ${tournamentId}. Total clients: ${clients[tournamentId].length}`);

    // Handle client disconnect
    req.on('close', () => {
        clients[tournamentId] = clients[tournamentId].filter(client => client !== res);
        console.log(`Client disconnected from SSE for tournament ${tournamentId}. Remaining clients: ${clients[tournamentId].length}`);
    });
});

// Helper function to send events to all clients of a specific tournament
const sendSseEvent = (tournamentId, data) => {
    if (clients[tournamentId]) {
        clients[tournamentId].forEach(client => {
            client.write(`data: ${JSON.stringify(data)}

`);
        });
    }
};

// POST /api/tournaments/:id/score - Admin updates score and notifies clients
router.post('/api/tournaments/:id/score', (req, res) => {
    const tournamentId = req.params.id;
    const { matchId, newScore } = req.body;

    // In a real app, you would update the database here
    console.log(`Admin updated score for tournament ${tournamentId}, match ${matchId} to ${newScore}`);

    // Notify all connected clients for this tournament
    sendSseEvent(tournamentId, { type: 'scoreUpdate', matchId, newScore });

    res.status(200).send('Score updated and event sent.');
});

// POST /api/tournaments/:id/suggest-score - Public suggests score and notifies admin
router.post('/api/tournaments/:id/suggest-score', (req, res) => {
    const tournamentId = req.params.id;
    const { matchId, suggestedScore } = req.body;

    // In a real app, you would notify the admin (e.g., via a separate SSE channel or admin dashboard update)
    console.log(`Public suggested score for tournament ${tournamentId}, match ${matchId}: ${suggestedScore}`);

    // For now, we'll just log it. If there was an admin-specific SSE, we'd use it here.
    // sendSseEvent(tournamentId, { type: 'scoreSuggestion', matchId, suggestedScore, from: 'public' });

    res.status(200).send('Score suggestion received.');
});

// GET /api/players/search - Search for players by name or email
router.get('/players/search', async (req, res) => {
    try {
        const q = req.query.q ? req.query.q.toLowerCase() : '';
        const currentUserId = req.session.userId; // Exclude the current user from search results

        let users = await userModel.getUsersByRole('player');

        if (q) {
            users = users.filter(user => 
                user.name.toLowerCase().includes(q) || 
                user.email.toLowerCase().includes(q)
            );
        }

        // Exclude the current user from the search results
        users = users.filter(user => user.id !== currentUserId);

        res.json(users.map(user => ({ id: user.id, name: user.name, email: user.email })));
    } catch (err) {
        console.error('Error searching for players:', err.message);
        res.status(500).json([]);
    }
});


// GET /api/tournaments/:id/public/bracket - Render the public tournament bracket
router.get('/tournaments/:id/public/bracket', async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const tournament = await tournamentModel.getTournamentById(tournamentId);
        if (!tournament) {
            return res.status(404).send('Tournament not found');
        }
        const matches = await tournamentModel.getMatchesWithPlayersByTournament(tournamentId);
        const courts = await clubModel.getCourtsByClubId(tournament.club_id); 
        // Use a dummy t function for public view as i18n might not be available
        const t = (key) => key; 
        const viewModel = tournamentPresenter.presentTournament(tournament, matches, [], courts, t, null); // No registeredPlayers or userId for public view

        res.render('public/tournament_elimination_public', {
            viewModel
        });
    } catch (err) {
        console.error('Error fetching public tournament bracket:', err.message);
        res.status(500).send('Error loading public tournament bracket');
    }
});

// GET /api/tournaments/:id/public/wallshow - Render the public tournament wallshow
router.get('/tournaments/:id/public/wallshow', async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const tournament = await tournamentModel.getTournamentById(tournamentId);
        if (!tournament) {
            return res.status(404).send('Tournament not found');
        }
        const matches = await tournamentModel.getMatchesWithPlayersByTournament(tournamentId);
        const courts = await clubModel.getCourtsByClubId(tournament.club_id); 
        console.log('Courts for wallshow:', courts);
        const t = (key) => key; // Dummy t function for public view
        const wallshowData = tournamentPresenter.presentWallshowData(tournament, matches, courts, t);
        res.render('public/tournament_wallshow', wallshowData);
    } catch (err) {
        console.error('Error fetching public tournament wallshow:', err.message);
        res.status(500).send('Error loading public tournament wallshow');
    }
});

module.exports = router;