// var mongoose = require('mongoose');
// var bcrypt = require('bcryptjs');

// User Schema
// var UserSchema = mongoose.Schema({
//     username: {
//         type: String,
//         index: true
//     },
//     password: {
//         type: String
//     },
//     email: {
//         type: String
//     },
//     name: {
//         type: String
//     }
// });

var User = [{
    username: 'user',
    password: 'user'
}];

//var User = module.exports = mongoose.model('User', UserSchema);

// module.exports.createUser = function(newUser, callback) {
//     bcrypt.genSalt(10, function(err, salt) {
//         bcrypt.hash(newUser.password, salt, function(err, hash) {
//             newUser.password = hash;
//             newUser.save(callback);
//         });
//     });
// }

// module.exports.getUserByUsername = function(username, callback) {
//     var query = { username: username };
//     User.findOne(query, callback);
// }

module.exports.getUserByUsername = function(username, callback) {
    var found = null;
    console.log("searching....");
    for (var i = 0; i < User.length; i++) {
        var element = User[i];

        if (element.Key == username) {
            found = element;
        }
    }

    return found;

}

module.exports.comparePassword = function(candidatePassword, hash, callback) {
    if (candidatePassword === hash) {
        callback(null, isMatch);
    } else {
        throw err;
    }

}

// module.exports.getUserById = function(id, callback) {
//     User.findById(id, callback);
// }

// module.exports.comparePassword = function(candidatePassword, hash, callback) {
//     bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
//         if (err) throw err;
//         callback(null, isMatch);
//     });
// }