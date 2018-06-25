var express = require('express');
var router = express.Router();

// Get Homepage
router.get('/', ensureAuthenticated, function(req, res) {
    res.render('editorLogin');
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        res.redirect('/users/api/dashboard');
    } else {
        return next();
    }
}


module.exports = router;