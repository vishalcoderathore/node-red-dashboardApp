var express = require('express');
var router = express.Router();

// Dashboard Login
router.get('/dashboardLogin', function(req, res) {
    res.render('dashboardLogin');
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        res.redirect('/users/api/dashboard');
    } else {
        return next();
    }
}

module.exports = router;