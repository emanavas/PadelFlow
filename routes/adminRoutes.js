const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/authMiddleware');
const clubModel = require('../models/clubModel');
const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');

// Admin dashboard
router.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        const clubs = await clubModel.getClubsByActivity();
        const viewersData = {
            labels: ['Hace 6 días', 'Hace 5 días', 'Hace 4 días', 'Hace 3 días', 'Ayer', 'Hoy'],
            data: [5, 8, 15, 12, 25, 30]
        };
        res.render('admin/dashboard', {
            user: req.user,
            clubs: clubs,
            viewersData: viewersData
        });
    } catch (err) {
        console.error('Error fetching clubs by activity:', err.message);
        res.status(500).send('Error fetching clubs by activity');
    }
});

// Route to display the create club form
router.get('/clubs/create', isAuthenticated, (req, res) => {
    res.render('admin/create_club');
});

// Route to handle the create club form submission
router.post('/clubs/create', isAuthenticated, async (req, res) => {
    try {
        const { name, address, city, contact_email, contact_phone } = req.body;
        const result = await clubModel.createClub(name, address, city, contact_email, contact_phone);
        console.log('Club created:', result.id);
        res.redirect('/admin/clubs');
    } catch (err) {
        console.error('Error creating club:', err.message);
        res.status(500).send('Error creating club');
    }
});

// Route to display the create user form
router.get('/users/create', isAuthenticated, async (req, res) => {
    try {
        const clubs = await clubModel.getAllClubs();
        res.render('admin/create_user', { user: req.user, clubs: clubs });
    } catch (err) {
        console.error('Error fetching clubs:', err.message);
        res.status(500).send('Error fetching clubs.');
    }
});

// Route to handle the create user form submission
router.post('/users/create', isAuthenticated, async (req, res) => {
    try {
        const { name, email, password, role, club_id } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const finalClubId = club_id === '' ? null : parseInt(club_id);
        const result = await userModel.createUser(name, email, hashedPassword, role, finalClubId);
        console.log('User created:', result.id);
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error('Error creating user:', err.message);
        res.status(500).send('Error creating user.');
    }
});

// Route to display the edit user form
router.get('/users/edit/:id', isAuthenticated, async (req, res) => {
    try {
        const userId = req.params.id;
        const userToEdit = await userModel.findUserById(userId);
        if (!userToEdit) {
            return res.status(404).send('User not found.');
        }
        const clubs = await clubModel.getAllClubs();
        res.render('admin/edit_user', { user: req.user, userToEdit: userToEdit, clubs: clubs });
    } catch (err) {
        console.error('Error fetching user for edit:', err ? err.message : 'User not found');
        res.status(500).send('Error fetching user or clubs.');
    }
});

// Route to handle the edit user form submission
router.post('/users/edit/:id', isAuthenticated, async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, email, password, role, club_id } = req.body;

        const updateFields = { name, email, role };
        updateFields.club_id = (club_id === '') ? null : parseInt(club_id, 10);

        if (password) {
            updateFields.password = await bcrypt.hash(password, 10);
        }

        await userModel.updateUser(userId, updateFields);
        console.log('User updated:', userId);
        res.redirect('/admin/users');
    } catch (err) {
        console.error('Error updating user:', err.message);
        res.status(500).send('Error updating user.');
    }
});

// Route to display all users
router.get('/users', isAuthenticated, async (req, res) => {
    try {
        const allUsers = await userModel.getAllUsers();
        res.render('admin/users', {
            user: req.user,
            allUsers: allUsers
        });
    } catch (err) {
        console.error('Error fetching all users:', err.message);
        res.status(500).send('Error fetching all users');
    }
});

// Route to display all clubs
router.get('/clubs', isAuthenticated, async (req, res) => {
    try {
        const allClubs = await clubModel.getAllClubs();
        res.render('admin/clubs', { 
            user: req.user,
            allClubs: allClubs
        });
    } catch (err) {
        console.error('Error fetching all clubs:', err.message);
        res.status(500).send('Error fetching all clubs');
    }
});

// Route to delete a club
router.get('/clubs/delete/:id', isAuthenticated, async (req, res) => {
    try {
        const clubId = req.params.id;
        await clubModel.deleteClub(clubId);
        res.redirect('/admin/clubs');
    } catch (err) {
        console.error('Error deleting club:', err.message);
        res.status(500).send('Error deleting club');
    }
});

module.exports = router;