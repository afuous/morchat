"use strict";

let mongoose = require("mongoose");
let bcrypt = require("bcryptjs");
let Schema = mongoose.Schema;
let ObjectId = Schema.Types.ObjectId;
let Promise = require("bluebird");
let SALT_WORK_FACTOR = 10;

function createToken(size) {
    let token = "";
    for (let i = 0; i < size; i++) {
        let rand = Math.floor(Math.random() * 62);
        token += String.fromCharCode(rand + ((rand < 26) ? 97 : ((rand < 52) ? 39 : -4)));
    }
    return token;
}

var userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    firstname: {
        type: String,
        required: true,
    },
    lastname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: String, // changed from Number
        required: false,
    },
    created_at: Date,
    updated_at: Date,
    profpicpath: String,
    mobileDeviceTokens: {
        type: [{
            type: String,
            required: true,
        }],
        default: [],
    },
    email_confirmed: {
        type: Boolean,
        default: false,
    },
    email_token: String,
});

userSchema.pre("save", function(next) {
    let now = new Date();
    this.updated_at = now;
    if (!this.created_at) {
        this.created_at = now;
    }
    next();
});

// userSchema.pre("save", function(next) {
//     let capitalize = (str) => (
//         str[0].toUpperCase() + str.slice(1).toLowerCase()
//     );
//     this.firstname = capitalize(this.firstname);
//     this.lastname = capitalize(this.lastname);
//     next();
// });

userSchema.pre("save", function(next) {
    let user = this;

    if (!user.isModified("password")) return next();

    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);

        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) return next(err);

            user.password = hash;
            next();
        });
    });
});

userSchema.methods.comparePassword = function(candidatePassword) {
    let password = this.password;
    return new Promise(function(resolve, reject) { // antipattern but whatever
        bcrypt.compare(candidatePassword, password, function(err, isMatch) {
            if (err) {
                reject(err);
            } else {
                resolve(isMatch);
            }
        });
    });
};

userSchema.methods.assignNewPassword = function() {
    let user = this;
    let newPassword = createToken(8);
    user.password = newPassword;
    return Promise.resolve(newPassword);
};

userSchema.methods.assignEmailVerif = function() {
    let user = this;
    let emailVerif = createToken(16);
    user.email_token = emailVerif;
    return Promise.resolve(emailVerif);
};

let User = mongoose.model("User", userSchema);

module.exports = User;
