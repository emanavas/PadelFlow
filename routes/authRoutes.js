const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const clubModel = require('../models/clubModel');
const playerModel = require('../models/playerModel');
const userModel = require('../models/userModel');

// Route to display login form
router.get('/login', (req, res) => {
    res.render('auth/login', {
        title: req.t('loginTitle'),
        mensaje: req.session.mensaje || null
    });
    req.session.mensaje = null;
});

// Route to process login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findUserByEmail(email);
        if (!user) {
            req.session.mensaje = 'Credenciales inválidas.';
            return res.redirect('/login');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.session.mensaje = 'Credenciales inválidas.';
            return res.redirect('/login');
        }

        req.session.userId = user.id;
        req.session.userRole = user.role;

        if (user.role === 'club_admin' && user.club_id) {
            req.session.clubId = user.club_id;
        }

        if (user.role === 'platform_admin') {
            res.redirect('/admin/dashboard');
        } else if (user.role === 'club_admin') {
            res.redirect('/club/dashboard');
        } else if (user.role === 'player') {
            res.redirect('/player/dashboard');
        } else {
            res.redirect('/');
        }
    } catch (err) {
        console.error('Error during login:', err.message);
        req.session.mensaje = 'Error interno en el login.';
        res.redirect('/login');
    }
});

// Route to display club/admin registration form
router.get('/signup', (req, res) => {
    res.render('auth/signup', { title: req.t('signupTitle') });
});

// Route to process club/admin registration
router.post('/signup', async (req, res) => {
    try {
        const { userType, clubName, email, password } = req.body; 
        const hashedPassword = await bcrypt.hash(password, 10);

        if (userType === 'club_admin') {
            if (!clubName) {
                return res.status(400).send('Club Name is required for Club Admin registration.');
            }
            const clubResult = await clubModel.createClub(clubName);
            const clubId = clubResult.id;

            await userModel.createUser(email, hashedPassword, 'club_admin', clubId);
            console.log('Club and Club Admin registered');
            res.redirect('/login');
        } else if (userType === 'platform_admin') {
            await userModel.createUser(email, hashedPassword, 'platform_admin', null);
            console.log('Platform Admin registered');
            res.redirect('/login');
        } else {
            return res.status(400).send('Invalid user type selected.');
        }
    } catch (err) {
        console.error('Error during user registration:', err.message);
        res.status(500).send('Error during user registration.');
    }
});

// Route to display player self-registration form
router.get('/player/register', (req, res) => {
    res.render('auth/player_signup', { title: req.t('playerSignupTitle') });
});

// Route to process player self-registration
router.post('/player/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const userResult = await userModel.createUser(email, hashedPassword, 'player', null);
        const userId = userResult.id;
        await playerModel.createPlayer(null, userId, name);
        console.log('Player self-registered:', userId);
        res.redirect('/login');
    } catch (err) {
        console.error('Error during player self-registration:', err.message);
        res.status(500).send('Error during player self-registration.');
    }
});

// Existing route for player registration (by club admin or tournament context)
router.post('/player/signup', async (req, res) => {
    try {
        const { tournamentId, name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const userResult = await userModel.createUser(email, hashedPassword, 'player', null);
        const userId = userResult.id;
        await playerModel.createPlayer(tournamentId, userId, name);
        console.log('Player user and entry registered:', userId);
        res.status(200).send('Player registered successfully.');
    } catch (err) {
        console.error('Error during player user registration:', err.message);
        res.status(500).send('Error during player user registration.');
    }
});

// Route to log out
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Could not log out.');
        }
        res.clearCookie('connect.sid'); // Clear session cookie (adjust name if different)
        res.redirect('/login'); // Redirect to login page
    });
});

module.exports = router;