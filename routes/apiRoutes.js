const express = require('express');
const router = express.Router();

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

const getSseClients = () => clients;

module.exports = { router, getSseClients };
