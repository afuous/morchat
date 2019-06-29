"use strict";

let express = require("express");
let ObjectId = require("mongoose").Types.ObjectId;
let Promise = require("bluebird");
let util = require("./util");

let handler = util.handler;
let requireLogin = util.requireLogin;
let checkBody = util.middlechecker.checkBody;
let types = util.middlechecker.types;

let User = require("./models/User");


let router = express.Router();

router.post("/login", checkBody({
    emailOrUsername: types.string,
    password: types.string,
    mobileDeviceToken: types.maybe(types.string),
}), handler(function*(req, res) {

    let user = yield User.findOne({
        $or: [{
            username: req.body.emailOrUsername,
        }, {
            email: req.body.emailOrUsername,
        }],
    }).select("+password");

    if (!user || !(yield user.comparePassword(req.body.password))) {
        return res.status(400).end("Invalid login credentials");
    }

    if (req.body.mobileDeviceToken
        && user.mobileDeviceTokens.indexOf(req.body.mobileDeviceToken) === -1
    ) {
        user.mobileDeviceTokens.push(req.body.mobileDeviceToken);
        yield user.save();
    }

    delete user.password;

    // store user info in cookies
    req.session.userId = user._id;

    res.json(user);

}));

router.post("/logout", checkBody({
    mobileDeviceToken: types.maybe(types.string),
}), requireLogin, handler(function*(req, res) {
    // destroy user session cookie
    req.session.destroy(function(err) {
        if (err) {
            console.error(err);
            res.status(500).end("Logout unsuccessful");
        } else if (req.body.mobileDeviceToken) {
            let index = req.user.mobileDeviceTokens.indexOf(req.body.mobileDeviceToken);
            if (index !== -1) {
                req.user.mobileDeviceTokens.splice(index, 1);
                req.user.save().then(() => {
                    res.end();
                });
            } else {
                res.end();
            }
        } else {
            res.end();
        }
    });
}));

router.post("/users", checkBody({
    username: types.string,
    password: types.string,
    firstname: types.string,
    lastname: types.string,
    email: types.string,
    phone: types.string,
}), handler(function*(req, res) {

    // capitalize names
    // req.body.firstname = req.body.firstname.capitalize();
    // req.body.lastname = req.body.lastname.capitalize();

    // remove parentheses and dashes from phone number
    req.body.phone = req.body.phone.replace(/[- )(]/g, "")

    // if phone and email are valid (see util.js for validation methods)
    if (!util.validateEmail(req.body.email)) {
        return res.status(400).end("Invalid email");
    }
    if (!util.validatePhone(req.body.phone)) {
        return res.status(400).end("Invalid phone number");
    }

    // TODO: is this necessary with the unique thing in User.js?
    // check if a user with either same username, email, or phone already exists
    let same = yield User.findOne({
        $or: [{
            username: req.body.username,
        }, {
            email: req.body.email,
        }]
    });
    if (same) {
        if (same.username == req.body.username) {
            return res.status(400).end("Username is taken");
        }
        if (same.email == req.body.email) {
            return res.status(400).end("Email is taken");
        }
    }

    let userInfo = {
        username: req.body.username,
        password: req.body.password,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        phone: req.body.phone
    };

    userInfo.profpicpath = "/images/user.jpg"; // default profile picture

    let user;
    try {
        user = yield User.create(userInfo);
    } catch (err) {
        console.log(err)
        return res.status(400).end("Invalid user info");
    }

    // let emailToken = yield user.assignEmailVerif();
    // yield util.mail.sendEmail({
    //     to: req.body.email,
    //     subject: "MorTeam Email Verification",
    //     html: "Welcome to MorTeam. Please verify your email by going to https://morteam.com/users/token/" + emailToken + "/verify/",
    // });

    res.json(user);

}));

router.get("/users", checkBody(), requireLogin, handler(function*(req, res) {

    let users = yield User.find({
        team: req.user.team,
    });

    res.json(users);

}));

router.get("/users/id/:userId", checkBody(), requireLogin, handler(function*(req, res) {

    let user = yield User.findOne({
        _id: req.params.userId
    });

    res.json(user);

}));

router.get("/users/search", checkBody({
    search: types.string,
}), requireLogin, handler(function*(req, res) {

    let regexString = String(req.query.search).trim().replace(/\s/g, "|");
    let re = new RegExp(regexString, "ig");

    // find maximum of 10 users that match the search criteria
    let users = yield User.find({
        team: req.user.team,
        $or: [{
            firstname: re,
        }, {
            lastname: re,
        }],
    }).limit(10);

    res.json(users);

}));

router.put("/password", checkBody({
    oldPassword: types.string,
    newPassword: types.string,
}), requireLogin, handler(function*(req, res) {

    let user = yield User.findOne({
        _id: req.user._id
    }, "+password");

    // check if old password is correct
    if (!(yield user.comparePassword(req.body.oldPassword))) {
        return res.status(403).end("Your old password is incorrect");
    }

    // set and save new password (password is automatically encrypted. see /models/User.js)
    user.password = req.body.newPassword;
    yield user.save();
    // TODO: there should be a method on user to create a new encrypted password instead of doing it like this

    res.end();

}));

router.put("/profile", checkBody({
    firstname: types.string,
    lastname: types.string,
    email: types.string,
    phone: types.string,
}), requireLogin, handler(function*(req, res) {

    if (!util.validateEmail(req.body.email)) {
        return res.status(400).end("Invalid email address");
    }
    if (!util.validatePhone(req.body.phone)) {
        return res.status(400).end("Invalid phone number");
    }

    req.user.firstname = req.body.firstname;
    req.user.lastname = req.body.lastname;
    req.user.email = req.body.email;
    req.user.phone = req.body.phone;

    yield req.user.save();

    res.json(req.user);

}));

// get information about the currently logged in user
router.get("/users/self", checkBody(), requireLogin, handler(function*(req, res) {
    res.json(req.user);
}));

router.post("/forgotPassword", checkBody({
    emailOrUsername: types.string,
}), handler(function*(req, res) {

    let user = yield User.findOne({
        $or: [{
            email: req.body.emailOrUsername,
        }, {
            username: req.body.emailOrUsername,
        }],
    });

    if (!user) {
        return res.status(400).end("User not found");
    }

    let newPassword = yield user.assignNewPassword();
    yield user.save();

    // TODO: we are emailing passwords in plaintext
    // they are temporary passwords but still
    // see http://security.stackexchange.com/questions/32589/temporary-passwords-e-mailed-out-as-plain-text
    // should be an access token instead of the actual password

    // email user new password
    yield util.mail.sendEmail({
        to: user.email,
        subject: "New MorTeam Password Request",
        html: "It seems like you requested to reset your password. Your new password is " + newPassword + ". Feel free to reset it after you log in.",
    });

    res.end();

}));

router.put("/users/token/:emailToken/verify", checkBody(), handler(function*(req, res) {

    let user = yield User.findOneAndUpdate({
        email_token: req.params.emailToken,
    }, {
        $set: { email_confirmed: true },
    });

    res.end();

}));

module.exports = router;
