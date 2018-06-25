var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt');
const saltRounds = 10;

// Database Connection
//const connection = require('../db.js');
var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'vrathoremysql.cpdhzb7tqdsn.us-west-1.rds.amazonaws.com',
    user: 'vrathoreMySQL',
    password: 'vrathoreMySQL',
    database: 'vrathoreMySQL'
});

// used to serialize the user for the session
passport.serializeUser(function(user, done) {
    console.log("--> Running serializeUser()");
    done(null, user);
});

// used to deserialize the user
passport.deserializeUser(function(user, done) {
    connection.query("select * from users where id = " + user.id, function(err, rows) {
        if (err) throw err;
        console.log('--> Running deserializeUser(), id: ' + rows[0].id);
        done(null, rows[0].id);
    });
});

// Local Login using Passport
passport.use(new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback
    },
    function(req, username, password, done) { // callback with username and password from our form
        connection.query('SELECT * FROM users WHERE username = ?', [username], function(err, results, fields) {
            if (err) { done(err); }

            if (results.length == 0) { done(null, false, { message: 'Unknown User' }); } else {
                const hash = results[0].password.toString();

                bcrypt.compare(password, hash, function(err, res) {
                    if (res) {
                        return done(null, results[0]);
                    } else {
                        return done(null, false, { message: 'Invalid password' });
                    }
                });
            }
        });
    }));


// Register new User
router.post('/registerUser', function(req, res) {
    var errors = '';
    req.checkBody('username', 'Username Required').notEmpty();
    req.checkBody('password', 'Password Required').notEmpty();

    if (req.body.username && req.body.password) {
        if (req.body.confirmPassword) {
            req.checkBody('confirmPassword', 'Passwords do not match, please try again').equals(req.body.password);
        } else {
            req.checkBody('confirmPassword', 'Confirm Password').notEmpty();
        }
    }
    errors = req.validationErrors();
    if (errors) {
        res.render('registerUser', { title: 'Registration Complete', errors: errors });
    } else {
        console.log('username: ' + req.body.username);
        console.log('pwd: ' + req.body.password);
        var username = req.body.username;
        var password = req.body.password;
        bcrypt.hash(password, saltRounds, function(err, hash, done) {
            connection.query("select * from users where username = '" + username + "'", function(err, rows) {
                console.log(rows);
                console.log("above row object");
                if (err) {
                    throw err;
                }
                if (rows.length) {
                    // return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
                    req.flash('error_msg', 'Username already taken');
                    res.redirect('/users/registerUser');

                } else {
                    // if there is no user with that username
                    // create the user
                    var newUserMysql = new Object();

                    newUserMysql.username = username;
                    newUserMysql.password = password; // use the generateHash function in our user model

                    var insertQuery = "INSERT INTO users ( username, password ) VALUES (?, ?)";
                    connection.query(insertQuery, [username, hash], function(err, rows) {
                        //newUserMysql.id = rows.insertId;
                        if (err) throw err;

                        //return done(null, newUserMysql);
                        //connection.query('');
                        req.flash('success_msg', 'User registered successfully');
                        res.redirect('/users/registerUser');
                    });
                }
            });
            console.log(username);
        });
    }
});

// Login existing user
router.post('/dashboardLogin',
    passport.authenticate('local', {
        successRedirect: '/users/api/dashboard',
        failureRedirect: '/users/dashboardLogin',
        failureFlash: true
    })
);

// Logout from existing session
router.get('/dashboardLogout', function(req, res) {
    req.logout();
    req.session.destroy(() => {
        //req.flash('success_msg', 'You are logged out');
        res.clearCookie('connect.sid');
        res.redirect('/users/dashboardLogin');
    });

});

module.exports = router;