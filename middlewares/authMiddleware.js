const userModel = require('../models/userModel');

const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        userModel.findUserById(req.session.userId, (err, user) => {
            if (err || !user) {
                console.error('Error finding user for session:', err ? err.message : 'User not found');
                return res.redirect('/login');
            }
            req.user = user;
            req.clubId = user.club_id; // Attach club_id to request if user is a club admin or player
            next();
        });
    } else {
        res.redirect('/login');
    }
};

const isClubAdmin = (req, res, next) => {
    // Check if user is a club admin or platform admin
    if (req.user && (req.user.role === 'club_admin' || req.user.role === 'platform_admin')) {
        next();
    } else {
        res.status(403).send('Access Denied: You are not an administrator for this club or your role is incorrect.');
    }
};

const isPlatformAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'platform_admin') {
        next();
    } else {
        res.status(403).send('Access Denied: Only platform administrators can access this page.');
    }
};

module.exports = { isAuthenticated, isClubAdmin, isPlatformAdmin };