const express = require('express');
const router = express.Router();
const { isAuthenticated, isClubAdmin } = require('../middlewares/authMiddleware');
const tournamentModel = require('../models/tournamentModel');
const clubModel = require('../models/clubModel');
const userModel = require('../models/userModel'); // Import userModel
const bcrypt = require('bcryptjs'); // Import bcrypt
const { getSseClients } = require('./apiRoutes'); // Import the function

// Admin dashboard
router.get('/dashboard', isAuthenticated, (req, res) => {
    clubModel.getClubsByActivity((err, clubs) => {
        if (err) {
            console.error('Error fetching clubs by activity:', err.message);
            return res.status(500).send('Error fetching clubs by activity');
        }

        const sseClients = getSseClients();
        let totalWallshowUsers = 0;
        for (const tournamentId in sseClients) {
            totalWallshowUsers += sseClients[tournamentId].length;
        }

        // Fake data for the chart
        const viewersData = {
            labels: ['Hace 6 días', 'Hace 5 días', 'Hace 4 días', 'Hace 3 días', 'Ayer', 'Hoy'],
            data: [5, 8, 15, 12, 25, 30]
        };

        res.render('admin/dashboard', {
            user: req.user,
            clubs: clubs,
            totalWallshowUsers: totalWallshowUsers,
            viewersData: viewersData
        });
    });
});


// Route to display the create club form
router.get('/clubs/create', isAuthenticated, (req, res) => {
    res.render('admin/create_club');
});

// Route to handle the create club form submission
router.post('/clubs/create', isAuthenticated, (req, res) => {
    const { name, address, city, contact_email, contact_phone } = req.body;
    // adminId is no longer passed to createClub, but can be used to assign club_id to user if needed
    const adminId = req.user.id; 

    clubModel.createClub(name, address, city, contact_email, contact_phone, (err, result) => {
        if (err) {
            console.error('Error creating club:', err.message);
            return res.status(500).send('Error creating club');
        }
        console.log('Club created:', result.id);
        res.redirect('/admin/clubs');
    });
});

// Route to display the create user form
router.get('/users/create', isAuthenticated, (req, res) => {
    clubModel.getAllClubs((err, clubs) => {
        if (err) {
            console.error('Error fetching clubs:', err.message);
            return res.status(500).send('Error fetching clubs.');
        }
        res.render('admin/create_user', { user: req.user, clubs: clubs });
    });
});

// Route to handle the create user form submission
router.post('/users/create', isAuthenticated, (req, res) => {
    const { email, password, role, club_id } = req.body;

    // Hash password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err.message);
            return res.status(500).send('Error during user creation.');
        }

        // Convert club_id to null if it's an empty string (from "Ninguno" option)
        const finalClubId = club_id === '' ? null : parseInt(club_id);

        userModel.createUser(email, hashedPassword, role, finalClubId, (err, result) => {
            if (err) {
                console.error('Error creating user:', err.message);
                return res.status(500).send('Error creating user.');
            }
            console.log('User created:', result.id);
            res.redirect('/admin/dashboard'); // Redirect to admin dashboard or user list
        });
    });
});

// Route to display the edit user form
router.get('/users/edit/:id', isAuthenticated, (req, res) => {
    const userId = req.params.id;
    userModel.findUserById(userId, (err, userToEdit) => {
        if (err || !userToEdit) {
            console.error('Error fetching user for edit:', err ? err.message : 'User not found');
            return res.status(404).send('User not found.');
        }
        clubModel.getAllClubs((err, clubs) => {
            if (err) {
                console.error('Error fetching clubs for edit user form:', err.message);
                return res.status(500).send('Error fetching clubs.');
            }
            res.render('admin/edit_user', { user: req.user, userToEdit: userToEdit, clubs: clubs });
        });
    });
});

// Route to handle the edit user form submission
router.post('/users/edit/:id', isAuthenticated, (req, res) => {
    const userId = req.params.id;
    const { email, password, role, club_id } = req.body;

    // Prepare fields to update
    let updateFields = { email, role };
    if (club_id === '') {
        updateFields.club_id = null; // Set to null if "Ninguno" is selected
    } else {
        updateFields.club_id = parseInt(club_id);
    }

    // Only hash password if provided (i.e., not empty)
    if (password) {
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Error hashing password for update:', err.message);
                return res.status(500).send('Error updating user.');
            }
            updateFields.password = hashedPassword;
            userModel.updateUser(userId, updateFields.email, updateFields.password, updateFields.role, updateFields.club_id, (err, result) => {
                if (err) {
                    console.error('Error updating user:', err.message);
                    return res.status(500).send('Error updating user.');
                }
                console.log('User updated:', userId);
                res.redirect('/admin/users'); // Redirect to user list
            });
        });
    } else {
        // Update without changing password
        userModel.updateUser(userId, updateFields.email, undefined, updateFields.role, updateFields.club_id, (err, result) => {
            if (err) {
                console.error('Error updating user:', err.message);
                return res.status(500).send('Error updating user.');
            }
            console.log('User updated:', userId);
            res.redirect('/admin/users'); // Redirect to user list
        });
    }
});

// Route to display all users
router.get('/users', isAuthenticated, (req, res) => {
    userModel.getAllUsers((err, allUsers) => {
        if (err) {
            console.error('Error fetching all users:', err.message);
            return res.status(500).send('Error fetching all users');
        }
        res.render('admin/users', {
            user: req.user,
            allUsers: allUsers
        });
    });
});

// Route to display all clubs
router.get('/clubs', isAuthenticated, (req, res) => {
    clubModel.getAllClubs((err, allClubs) => {
        if (err) {
            console.error('Error fetching all clubs:', err.message);
            return res.status(500).send('Error fetching all clubs');
        }
        res.render('admin/clubs', { 
            user: req.user,
            allClubs: allClubs
        });
    });
});

// Route to delete a club
router.get('/clubs/delete/:id', isAuthenticated, (req, res) => {
    const clubId = req.params.id;
    clubModel.deleteClub(clubId, (err) => {
        if (err) {
            console.error('Error deleting club:', err.message);
            return res.status(500).send('Error deleting club');
        }
        res.redirect('/admin/clubs');
    });
});


//export
module.exports = router;
