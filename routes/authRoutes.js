const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const clubModel = require('../models/clubModel');
const playerModel = require('../models/playerModel');
const userModel = require('../models/userModel'); // Import userModel

// Ruta para mostrar el formulario de login
router.get('/login', (req, res) => {
    res.render('auth/login', { title: req.t('loginTitle') });
});

// Ruta para procesar el login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    userModel.findUserByEmail(email, (err, user) => {
        if (err) {
            console.error('Error finding user:', err.message);
            return res.status(500).send('Error during login.');
        }
        if (!user) {
            return res.status(400).send('Invalid credentials.');
        }

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Error comparing passwords:', err.message);
                return res.status(500).send('Error during login.');
            }
            if (!isMatch) {
                return res.status(400).send('Invalid credentials.');
            }

            req.session.userId = user.id; // Store user ID in session
            req.session.userRole = user.role; // Store user role in session

            // Redirect based on role
            if (user.role === 'platform_admin') {
                res.redirect('/admin/dashboard'); // Assuming a platform admin dashboard
            } else if (user.role === 'club_admin') {
                if (user.club_id) {
                    res.redirect(`/club/${user.club_id}/dashboard`); // Redirect to specific club dashboard
                } else {
                    res.redirect('/admin/dashboard'); // Fallback for club admins without a primary club_id
                }
            } else if (user.role === 'player') {
                res.redirect('/player/dashboard'); // Assuming a player dashboard
            } else {
                res.redirect('/'); // Default redirect
            }
        });
    });
});

// Ruta para mostrar el formulario de registro de club/admin
router.get('/signup', (req, res) => {
    res.render('auth/signup', { title: req.t('signupTitle') });
});

// Ruta para procesar el registro de club/admin
router.post('/signup', (req, res) => {
    const { userType, clubName, email, password } = req.body; 

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err.message);
            return res.status(500).send('Error during user registration.');
        }

        if (userType === 'club_admin') {
            if (!clubName) {
                return res.status(400).send('Club Name is required for Club Admin registration.');
            }
            clubModel.createClub(clubName, (err, clubResult) => {
                if (err) {
                    console.error('Error creating club:', err.message);
                    return res.status(500).send('Error during club registration.');
                }
                const clubId = clubResult.id;

                userModel.createUser(email, hashedPassword, 'club_admin', clubId, (err, userResult) => {
                    if (err) {
                        console.error('Error creating club admin user:', err.message);
                        return res.status(500).send('Error during user registration.');
                    }
                    console.log('Club and Club Admin registered:', userResult.id);
                    res.redirect('/login');
                });
            });
        } else if (userType === 'platform_admin') {
            userModel.createUser(email, hashedPassword, 'platform_admin', null, (err, userResult) => {
                if (err) {
                    console.error('Error creating platform admin user:', err.message);
                    return res.status(500).send('Error during user registration.');
                }
                console.log('Platform Admin registered:', userResult.id);
                res.redirect('/login');
            });
        } else {
            return res.status(400).send('Invalid user type selected.');
        }
    });
});

// Ruta para mostrar el formulario de registro de jugador (auto-registro)
router.get('/player/register', (req, res) => {
    res.render('auth/player_signup', { title: req.t('playerSignupTitle') });
});

// Ruta para procesar el auto-registro de jugador
router.post('/player/register', (req, res) => {
    const { name, email, password } = req.body;

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err.message);
            return res.status(500).send('Error during player self-registration.');
        }

        userModel.createUser(email, hashedPassword, 'player', null, (err, userResult) => { // club_id is null for self-registered players initially
            if (err) {
                console.error('Error creating player user:', err.message);
                return res.status(500).send('Error during player self-registration.');
            }
            const userId = userResult.id;

            playerModel.createPlayer(null, userId, name, (err, playerResult) => { // tournament_id is null initially
                if (err) {
                    console.error('Error creating player entry:', err.message);
                    return res.status(500).send('Error during player entry creation.');
                }
                console.log('Player self-registered:', userId, playerResult.id);
                res.redirect('/login'); // Redirect to login after successful registration
            });
        });
    });
});

// Existing route for player registration (by club admin or tournament context)
router.post('/player/signup', (req, res) => {
    const { tournamentId, name, email, password } = req.body; // Added password for player user

    // Create a user entry for the player
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing player password:', err.message);
            return res.status(500).send('Error during player user registration.');
        }

        userModel.createUser(email, hashedPassword, 'player', null, (err, userResult) => { // club_id can be null for players initially, or linked to a specific club if they register through one
            if (err) {
                console.error('Error creating player user:', err.message);
                return res.status(500).send('Error during player user registration.');
            }
            const userId = userResult.id;

            // Then, create the player entry linked to the user (if needed for tournament-specific data)
            playerModel.createPlayer(tournamentId, userId, name, (err, playerResult) => { // Changed email to userId
                if (err) {
                    console.error('Error creating player entry:', err.message);
                    return res.status(500).send('Error during player entry creation.');
                }
                console.log('Player user and entry registered:', userId, playerResult.id);
                res.status(200).send('Player registered successfully.');
            });
        });
    });
});

// Ruta para cerrar sesión
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

