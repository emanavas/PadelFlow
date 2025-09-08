const express = require('express');
const router = express.Router();

const { isAuthenticated, isClubAdmin } = require('../middlewares/authMiddleware');
const { checkFreemium } = require('../middlewares/freemiumMiddleware');
const tournamentModel = require('../models/tournamentModel');

// Apply isAuthenticated and isClubAdmin middleware to all routes in this file
router.use(isAuthenticated);
router.use(isClubAdmin);

// GET /dashboard - Render the admin dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const tournaments = await tournamentModel.getTournamentsByClubId(req.clubId);
        res.render('admin/dashboard', { tournaments: tournaments });
    } catch (err) {
        console.error('Error fetching tournaments:', err.message);
        res.status(500).send('Error loading dashboard');
    }
});

// GET /tournaments/create - Render the create tournament form
router.get('/tournaments/create', checkFreemium, (req, res) => {
    res.render('admin/create_tournament');
});

// POST /tournaments/create - Process the creation of a tournament
router.post('/tournaments/create', checkFreemium, async (req, res) => {
    try {
        const { name, type, startDate, endDate } = req.body;
        const club_id = req.clubId;
        const result = await tournamentModel.createTournament({ club_id, name, type, start_date: startDate, end_date: endDate });
        console.log('Tournament created:', result.id);
        res.redirect('/dashboard');
    } catch (err) {
        console.error('Error creating tournament:', err.message);
        res.status(500).send('Error creating tournament');
    }
});

module.exports = router;