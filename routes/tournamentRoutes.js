const express = require('express');
const router = express.Router();
const { isAuthenticated, isClubAdmin } = require('../middlewares/authMiddleware');
const { checkFreemium } = require('../middlewares/freemiumMiddleware');
const tournamentModel = require('../models/tournamentModel');

// Apply isAuthenticated and isClubAdmin middleware to all routes in this file
router.use(isAuthenticated);
// router.use(isClubAdmin);

// GET /dashboard - Render the admin dashboard
router.get('/dashboard', (req, res) => {
    tournamentModel.getTournamentsByClubId(req.clubId, (err, tournaments) => {
        if (err) {
            console.error('Error fetching tournaments:', err.message);
            return res.status(500).send('Error loading dashboard');
        }
        res.render('admin/dashboard', { tournaments: tournaments });
    });
});

// GET /tournaments/create - Render the create tournament form
router.get('/tournaments/create', checkFreemium, (req, res) => {
    res.render('admin/create_tournament');
});

// POST /tournaments/create - Process the creation of a tournament
router.post('/tournaments/create', checkFreemium, (req, res) => {
    const { name, type, startDate, endDate } = req.body;
    const club_id = req.clubId;

    tournamentModel.createTournament(club_id, name, type, startDate, endDate, (err, result) => {
        if (err) {
            console.error('Error creating tournament:', err.message);
            return res.status(500).send('Error creating tournament');
        }
        console.log('Tournament created:', result.id);
        res.redirect('/dashboard');
    });
});

module.exports = router;