"use strict";

/**
 * This file is meant to keep all of the variables and functions that are used among several different modules.
 */
let fs = require("fs");
let session = require("express-session");
let pgSession = require("connect-pg-simple")(session);
let config = require("./config");
let db = require("./db");

let util = {};

util.handler = function(func) {
    return function(req, res, next) {
        return func
            .apply(null, arguments)
            .catch(function(err) {
                if (err instanceof util.HttpError) {
                    res.status(err.code).end(err.message);
                } else {
                    console.error(err);
                    res.status(500).end("Internal server error");
                    // TODO: add real error handling and logging
                }
            });
    };
};

util.HttpError = function(code, message) {
    this.code = code;
    this.message = message;
};

// quick way to send a 404: not found error
util.send404 = function(res) {
    res.writeHead(404, {
        "Content-Type": "text/plain"
    });
    res.end("404: Page Not Found");
};

util.sessionMiddleware = session({
    secret: config.sessionSecret,
    saveUninitialized: false,
    resave: false,
    cookie: {
        domain: config.host,
    },
    store: new pgSession({
        pool: db.pool,
    }),
});

// checks if user provided email adress is valid
util.validateEmail = function(email) {
    let re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(String(email));
};

// checks if user provided phone number adress is valid
util.validatePhone = function(phone) {
    if (phone == "") {
        return true;
    }
    let match = String(phone).match(/\d/g);
    return match && match.length === 10;
};

// creates random string of any size
util.createToken = function(size) {
    let token = "";
    for (let i = 0; i < size; i++) {
        let rand = Math.floor(Math.random() * 62);
        token += String.fromCharCode(rand + ((rand < 26) ? 97 : ((rand < 52) ? 39 : -4)));
    }
    return token;
};

// can be used as middleware to check if user is logged in
util.requireLogin = function(req, res, next) {
    if (!req.user) {
        res.status(403).end("You are not logged in");
    } else {
        next();
    }
};

String.prototype.contains = function(arg) {
    return this.indexOf(arg) > -1;
};

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

// checks to see if an array has anything in common with another array
Array.prototype.hasAnythingFrom = function(arr) {

    let obj = {};

    for (let elem of arr) {
        obj[elem] = true;
    }

    for (let elem of this) {
        if (elem in obj) {
            return true;
        }
    }

    return false;
};

util.middlechecker = require("./middlechecker");
util.config = require("./config");
util.fcm = require("./fcm");
util.db = require("./db");
util.auth = require("./auth");

module.exports = util;
