const checkFreemium = (req, res, next) => {
    // For now, we'll just call next() to allow all requests.
    // In a real application, you would check freemium status and tournament count.
    console.log('checkFreemium middleware: Freemium check passed (dummy check).');
    next();
};

module.exports = { checkFreemium };
