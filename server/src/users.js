"use strict";

let express = require("express");
let ObjectId = require("mongoose").Types.ObjectId;
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
    useCookie: types.maybe(types.boolean),
}), handler(async function(req, res) {

    let user = await User.findOne({
        $or: [{
            username: util.caseInsensitiveRegex(req.body.emailOrUsername),
        }, {
            email: util.caseInsensitiveRegex(req.body.emailOrUsername),
        }],
    }).select("+password");

    if (!user || !(await user.comparePassword(req.body.password))) {
        return res.status(400).end("Invalid login credentials");
    }

    if (req.body.mobileDeviceToken
        && user.mobileDeviceTokens.indexOf(req.body.mobileDeviceToken) === -1
    ) {
        if (!user.mobileDeviceTokens) {
            user.mobileDeviceTokens = [];
        }
        user.mobileDeviceTokens.push(req.body.mobileDeviceToken);
        await user.save();
    }

    delete user.password;

    // store user info in cookies
    req.session.userId = user._id;

    req.session.cookie.maxAge = 365 * 24 * 60 * 60 * 1000;

    res.writeHead(200, {
        "Content-Type": "application/json",
    });
    let obj = {
        user: user,
    };
    if (req.body.useCookie === false) {
        let cookieString = res.getHeaders()["set-cookie"][0];
        let auth = cookieString.substring(0, cookieString.indexOf(";"));
        obj.auth = auth;
    }
    res.end(JSON.stringify(obj));

}));

router.post("/logout", checkBody({
    mobileDeviceToken: types.maybe(types.string),
}), requireLogin, handler(async function(req, res) {
    // destroy user session cookie
    req.session.destroy(async function(err) {
        if (err) {
            console.error(err);
            return res.status(500).end("Logout unsuccessful");
        }

        if (req.body.mobileDeviceToken) {
            let index = req.user.mobileDeviceTokens.indexOf(req.body.mobileDeviceToken);
            if (index !== -1) {
                req.user.mobileDeviceTokens.splice(index, 1);
                await req.user.save();
            }
        }

        res.end();
    });
}));

router.post("/users", checkBody({
    username: types.string,
    password: types.string,
    firstname: types.string,
    lastname: types.string,
    email: types.string,
    phone: types.string,
    profPicUrl: types.string,
}), handler(async function(req, res) {

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
    let same = await User.findOne({
        $or: [{
            username: util.caseInsensitiveRegex(req.body.username),
        }, {
            email: util.caseInsensitiveRegex(req.body.email),
        }]
    });
    if (same) {
        if (same.username.toLowerCase() == req.body.username.toLowerCase()) {
            return res.status(400).end("Username is taken");
        }
        if (same.email.toLowerCase() == req.body.email.toLowerCase()) {
            return res.status(400).end("Email is taken");
        }
    }

    let userInfo = {
        username: req.body.username,
        password: req.body.password,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        phone: req.body.phone,
        profPicUrl: req.body.profPicUrl,
    };

    let user;
    try {
        user = await User.create(userInfo);
    } catch (err) {
        console.log(err)
        return res.status(400).end("Invalid user info");
    }

    // let emailToken = await user.assignEmailVerif();
    // await util.mail.sendEmail({
    //     to: req.body.email,
    //     subject: "MorTeam Email Verification",
    //     html: "Welcome to MorTeam. Please verify your email by going to https://morteam.com/users/token/" + emailToken + "/verify/",
    // });

    res.json(user);

}));

router.get("/users", checkBody(), requireLogin, handler(async function(req, res) {

    let users = await User.find();

    res.json(users);

}));

router.get("/users/id/:userId", checkBody(), requireLogin, handler(async function(req, res) {

    let user = await User.findOne({
        _id: req.params.userId
    });

    res.json(user);

}));

router.get("/users/search", checkBody({
    search: types.string,
}), requireLogin, handler(async function(req, res) {

    let regexString = String(req.query.search).trim().replace(/\s/g, "|");
    let re = new RegExp(regexString, "ig");

    // find maximum of 10 users that match the search criteria
    let users = await User.find({
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
}), requireLogin, handler(async function(req, res) {

    let user = await User.findOne({
        _id: req.user._id
    }, "+password");

    // check if old password is correct
    if (!(await user.comparePassword(req.body.oldPassword))) {
        return res.status(403).end("Your old password is incorrect");
    }

    // set and save new password (password is automatically encrypted. see /models/User.js)
    user.password = req.body.newPassword;
    await user.save();
    // TODO: there should be a method on user to create a new encrypted password instead of doing it like this

    res.end();

}));

router.put("/profile", checkBody({
    firstname: types.string,
    lastname: types.string,
    email: types.string,
    phone: types.string,
    profPicUrl: types.string,
}), requireLogin, handler(async function(req, res) {

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
    req.user.profPicUrl = req.body.profPicUrl;

    await req.user.save();

    res.json(req.user);

}));

// get information about the currently logged in user
router.get("/users/self", checkBody(), requireLogin, handler(async function(req, res) {
    res.json(req.user);
}));

router.post("/forgotPassword", checkBody({
    emailOrUsername: types.string,
}), handler(async function(req, res) {

    let user = await User.findOne({
        $or: [{
            email: util.caseInsensitiveRegex(req.body.emailOrUsername),
        }, {
            username: util.caseInsensitiveRegex(req.body.emailOrUsername),
        }],
    });

    if (!user) {
        return res.status(400).end("User not found");
    }

    let newPassword = await user.assignNewPassword();
    await user.save();

    // TODO: we are emailing passwords in plaintext
    // they are temporary passwords but still
    // see http://security.stackexchange.com/questions/32589/temporary-passwords-e-mailed-out-as-plain-text
    // should be an access token instead of the actual password

    // email user new password
    await util.mail.sendEmail({
        to: user.email,
        subject: "New MorTeam Password Request",
        html: "It seems like you requested to reset your password. Your new password is " + newPassword + ". Feel free to reset it after you log in.",
    });

    res.end();

}));

router.put("/users/token/:emailToken/verify", checkBody(), handler(async function(req, res) {

    let user = await User.findOneAndUpdate({
        email_token: req.params.emailToken,
    }, {
        $set: { email_confirmed: true },
    });

    res.end();

}));

router.post("/addWebPushSubscription", checkBody({
    webPushSubscriptionStr: types.string,
}), handler(async function(req, res) {

    try {
        JSON.parse(req.body.webPushSubscriptionStr);
    } catch (e) {
        return res.status(400).end("Invalid subscription JSON");
    }

    await User.updateOne({
        _id: req.user._id,
    }, {
        $push: {
            webPushSubscriptionStrs: req.body.webPushSubscriptionStr,
        },
    });

    res.end();

}));

router.post("/removeWebPushSubscription", checkBody({
    webPushSubscriptionStr: types.string,
}), handler(async function(req, res) {

    let subscription;
    try {
        subscription = JSON.parse(req.body.webPushSubscriptionStr);
    } catch (e) {
        return res.status(400).end("Invalid subscription JSON");
    }

    for (let i = 0; i < req.user.webPushSubscriptionStrs.length; i++) {
        if (JSON.parse(req.user.webPushSubscriptionStrs[i]).endpoint == subscription.endpoint) {
            req.user.webPushSubscriptionStrs.splice(i, 1);
            i--;
        }
    }
    await req.user.save();

    res.end();

}));

module.exports = router;
