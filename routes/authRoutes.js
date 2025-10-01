const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const clubModel = require('../models/clubModel');
const userModel = require('../models/userModel');

// Route to display login form
router.get('/login', (req, res) => {
    res.render('auth/login', {
        title: req.t('loginTitle')
    });
});

// Route to process login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findUserByEmail(email);

        if (!user) {
            req.flash('error_msg', 'Credenciales invalidas.');
            return res.redirect('/login');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            req.flash('error_msg', 'Credenciales inválidas.');
            return res.redirect('/login');
        }

        req.session.userId = user.id;
        req.session.userRole = user.role;
        req.session.user = user; // Store user object in session

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
        req.flash('error_msg', 'Error interno en el login.');
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
                req.flash('error_msg', 'Club Name is required for Club Admin registration.');
                return res.redirect('/signup');
            }
            const clubResult = await clubModel.createClub(clubName);
            const clubId = clubResult.id;

            req.flash('success_msg', 'Club y Admin registrados correctamente');
            await userModel.createUser(email, hashedPassword, 'club_admin', clubId);
            console.log('Club and Club Admin registered');
            res.redirect('/login');
        } else if (userType === 'platform_admin') {
            await userModel.createUser(email, hashedPassword, 'platform_admin', null);
            req.flash('success_msg', 'Plataforma registrada correctamente');
            console.log('Platform Admin registered');
            res.redirect('/login');
        } else {
            req.flash('error_msg', 'Invalid user type selected.');
            return res.redirect('/signup');
        }
    } catch (err) {
        console.error('Error during user registration:', err.message);
        req.flash('error_msg', 'Error during user registration.');
        res.redirect('/signup');
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
        await userModel.createUser(name, email, hashedPassword, 'player', null);
        console.log('Player self-registered:', email);
        req.flash('success_msg', 'Jugador registrado correctamente. Por favor, inicie sesión.');
        res.redirect('/login');
    } catch (err) {
        console.error('Error during player self-registration:', err.message);
        req.flash('error_msg', 'Error during player self-registration.');
        res.redirect('/player/register');
    }
});

// Existing route for player registration (by club admin or tournament context)
router.post('/player/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await userModel.createUser(name, email, hashedPassword, 'player', null);
        req.flash('success_msg', 'Jugador registrado correctamente');
        console.log('Player user and entry registered:', email);
        res.status(200).send('Player registered successfully.');
    } catch (err) {
        console.error('Error during player user registration:', err.message);
        res.status(500).send('Error during player user registration.');
    }
});

// Route to log out
router.get('/logout', (req, res, next) => {
    if (req.session) {
        req.flash('success_msg', 'You have been logged out.');

        // Clear user-specific session data
        req.session.user = null;
        req.session.userId = null;
        req.session.userRole = null;
        req.session.clubId = null;

        req.session.save(function (err) {
            if (err) {
                console.error('Error saving session:', err);
                return next(err);
            }
            res.redirect('/login');
        });
    } else {
        // If no session exists, just redirect
        res.redirect('/login');
    }
});

module.exports = router;