const userModel = require('../models/userModel');

const isAuthenticated = async (req, res, next) => {
    if (req.session.userId) {
        try {
            const user = await userModel.findUserById(req.session.userId);
            if (!user) {
                console.error('Error finding user for session: User not found');
                return res.redirect('/login');
            }
            req.user = user;
            req.clubId = user.club_id; // Attach club_id to request
            next();
        } catch (err) {
            console.error('Error finding user for session:', err.message);
            return res.redirect('/login');
        }
    } else {
        res.redirect('/login');
    }
};

const isClubAdmin = async (req, res, next) => {
    // Check if user is a club admin or platform admin
    if (req.user && (req.user.role === 'club_admin' || req.user.role === 'platform_admin')) {
        next();
    } else {
        res.status(403).send('Access Denied: You are not an administrator for this club or your role is incorrect.');
    }
};

const isPlatformAdmin = async (req, res, next) => {
    if (req.user && req.user.role === 'platform_admin') {
        next();
    } else {
        res.status(403).send('Access Denied: Only platform administrators can access this page.');
    }
};

module.exports = { isAuthenticated, isClubAdmin, isPlatformAdmin };