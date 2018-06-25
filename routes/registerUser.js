var express = require('express');
var router = express.Router();

router.get('/registerUser', ensureAuthenticated, function(req, res) {
    res.render('registerUser');
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        res.redirect('/users/api/dashboard');
    } else {
        return next();
    }
}

module.exports = router;