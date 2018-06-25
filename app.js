var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var http = require('http');
var RED = require("node-red");
var sio = require('socket.io');

// Authentication Packages
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var MySQLStore = require('express-mysql-session')(session);
var bcrype = require('bcrypt');

// Required Path Routs
var index = require('./routes/passport');
var editorLogin = require('./routes/editorLogin');
var dashboardLogin = require('./routes/dashboardLogin');
var dashboardAccess = require('./routes/dashboardAccess');
var registerUser = require('./routes/registerUser');

// Options for MySQL Session Store
var options = {
    host: 'vrathoremysql.cpdhzb7tqdsn.us-west-1.rds.amazonaws.com',
    port: 3306,
    user: 'vrathoreMySQL',
    password: 'vrathoreMySQL',
    database: 'vrathoreMySQL'
};
var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'vrathoremysql.cpdhzb7tqdsn.us-west-1.rds.amazonaws.com',
    user: 'vrathoreMySQL',
    password: 'vrathoreMySQL',
    database: 'vrathoreMySQL'
});

var sessionStore = new MySQLStore(options);

// Init App
var app = express();
require('dotenv').config();

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({ defaultLayout: 'layout' }));
app.set('view engine', 'handlebars');

// BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));


// Create the settings object - see default settings.js file for other options
var settings = {
    httpAdminRoot: "/red",
    httpNodeRoot: "/users/api",
    userDir: "/home/vishal/Documents/Udemy/Traversy/node-passport",
    httpNodeMiddleware: function(req, res, next) {
        console.log("Middleware Exexuted");
        //console.log(req.rawHeaders);
        return next();
    },
    functionGlobalContext: {}, // enables global context
    logging: {
        // Only console logging is currently supported
        console: {
            // Level of logging to be recorded. Options are:
            // fatal - only those errors which make the application unusable should be recorded
            // error - record errors which are deemed fatal for a particular request + fatal errors
            // warn - record problems which are non fatal + errors + fatal errors
            // info - record information about the general running of the application + warn + error + fatal errors
            // debug - record information which is more verbose than info + info + warn + error + fatal errors
            // trace - record very detailed logging + debug + info + warn + error + fatal errors
            // off - turn off all logging (doesn't affect metrics or audit)
            level: "info",
            // Whether or not to include metric events in the log output
            metrics: false,
            // Whether or not to include audit events in the log output
            audit: false
        }
    }
};

//Set Port
app.set('port', (process.env.PORT || 1880));

// Check Passport entry for logged in user
var checkCookieStatus = function(session_id, req, res) {
    var sessionData = '';
    connection.query('SELECT * FROM sessions WHERE session_id = ?', [session_id], function(err, results, fields) {
        if (err) { throw err; }
        if (results.length == 0) { return null; } else {
            sessionData = JSON.parse(results[0].data).passport.user;
            console.log("line 103:" + sessionData);
            return sessionData;
        }
    });
};

var unauthorisedUserUIAccessMiddleware = function(req, res, next) {
    var sessionData = '';
    var sid = cookieParser.signedCookie(req.cookies['connect.sid'], 'hsjcnxQlk$cx!');
    console.log("SID for Dashboard UI request: " + sid);
    if (typeof sid !== "undefined") {
        connection.query('SELECT * FROM sessions WHERE session_id = ?', [sid], function(err, results, fields) {
            if (err) { throw err; }
            if (results.length == 0) { return null; } else {
                if (typeof JSON.parse(results[0].data).passport !== "undefined") {
                    console.log("Authorised User");
                    console.log('Request URL:', req.originalUrl);
                    return next();
                } else {
                    console.log("Un-Authorised User");
                    console.log('Request URL:', req.originalUrl);
                    var redirectToLoginPage = '/users/dashboardLogin/';
                    res.redirect(redirectToLoginPage);
                }
            }
        });
    } else {
        res.redirect('/');
    }
};

// Redirect user to Login page if user is unauthorised and access Dashboard UI
app.use('/users/api/ui', unauthorisedUserUIAccessMiddleware);

// Create a server
var server = app.listen(app.get('port'), function() {
    console.log('Server started on port ' + app.get('port'));
});

// Set Socket.io
var io = sio.listen(server);

// Prevent accessing Dashboard once logged out 
app.use(function(req, res, next) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
});

// Initialise the runtime with a server and settings
RED.init(server, settings);

// Serve the editor UI from /red
app.use(settings.httpAdminRoot, RED.httpAdmin);

// Serve the http nodes UI from /api
app.use(settings.httpNodeRoot, RED.httpNode);

//app.use(RED.httpNodeMiddleware, settings.httpNodeMiddleware);

// Express Session
app.use(session({
    secret: 'hsjcnxQlk$cx!',
    saveUninitialized: false,
    resave: false,
    store: sessionStore
}));

// Passport init
app.use(passport.initialize());
app.use(passport.session());


// Express Validator
app.use(expressValidator({
    errorFormatter: function(param, msg, value) {
        var namespace = param.split('.'),
            root = namespace.shift(),
            formParam = root;

        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param: formParam,
            msg: msg,
            value: value
        };
    }
}));

// Connect Flash
app.use(flash());

// Global Vars
app.use(function(req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next();
});

app.use('/users', index); // Include PassportJS
app.use('/users/api', dashboardAccess); // http://ip:1880/users/api/dashboard
app.use('/editorLogin', editorLogin); // http://ip:1880/editorLogin
app.use('/users', dashboardLogin); // http://ip:1880/users/dashboardLogin
app.use('/users', registerUser);
app.use('/', editorLogin);



// Start the runtime
RED.start();