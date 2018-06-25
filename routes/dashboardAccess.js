var express = require('express');
var router = express.Router();

router.get('/dashboard', ensureAuthenticated, function(req, res) {
    console.log("rendering dashboard");
    res.render('dashboard');
});


function ensureAuthenticated(req, res, next) {
    console.log('--> From DashboardLogin, sessionID: ' + req.sessionID);
    if (req.isAuthenticated()) {
        return next();
    } else {
        req.flash('error_msg', 'You are not logged in');
        res.redirect('/users/dashboardLogin');
    }
}

module.exports = router;