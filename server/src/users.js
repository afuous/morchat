"use strict";

let express = require("express");
let util = require("./util");

let handler = util.handler;
let requireLogin = util.requireLogin;
let checkBody = util.middlechecker.checkBody;
let types = util.middlechecker.types;
let HttpError = util.HttpError;
let db = util.db;


let router = express.Router();

router.post("/login", checkBody({
    emailOrUsername: types.string,
    password: types.string,
    mobileDeviceToken: types.maybe(types.string),
    useCookie: types.maybe(types.boolean),
}), handler(async function(req, res) {

    let user;

    await db.transaction(async client => {

        user = await db.queryOne(`
            SELECT *
            FROM users
            WHERE username = $1 or email = $1
        `, [req.body.emailOrUsername], client);
        if (!user) {
            throw new HttpError(400, "Invalid login credentials");
        }

        let passwordEntry = await db.queryOne(`
            SELECT *
            FROM password_entries
            WHERE user_id = $1
        `, [user.id], client);
        if (!await util.auth.checkPassword(req.body.password, passwordEntry.passwordHash)) {
            throw new HttpError(400, "Invalid login credentials");
        }

        if (req.body.mobileDeviceToken) {
            await db.queryOne(`
                INSERT INTO mobile_device_tokens
                (user_id, token)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING
            `, [user.id, req.body.mobileDeviceToken], client);
        }
    });

    req.session.userId = user.id;

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
}), requireLogin, function(req, res) {
    // destroy user session cookie
    req.session.destroy(async function(err) {
        if (err) {
            console.error(err);
            return res.status(500).end("Logout unsuccessful");
        }

        if (req.body.mobileDeviceToken) {
            await db.queryOne(`
                DELETE FROM mobile_device_tokens
                WHERE user_id = $1 AND token = $2
            `, [req.user.id, req.body.mobileDeviceToken]);
        }

        res.end();

    });
});

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
        throw new HttpError(400, "Invalid email");
    }
    if (!util.validatePhone(req.body.phone)) {
        throw new HttpError(400, "Invalid phone number");
    }

    if (req.body.username.indexOf("@") != -1) {
        // this may seem odd but I want to make sure the username is not an email
        // if the username can be an email then there is ambiguity when logging in
        // since then it isn't clear what emailOrUsername is
        // and could potentially match multiple users!
        throw new HttpError(400, "Username cannot contain @");
    }

    let passwordHash = await util.auth.generatePasswordHash(req.body.password);
    let user;

    await db.transactionSerializable(async client => {

        let same = await db.queryOne(`
            SELECT *
            FROM users
            WHERE username = $1 OR email = $2
        `, [req.body.username, req.body.email], client);
        if (same) {
            if (same.username.toLowerCase() == req.body.username.toLowerCase()) {
                throw new HttpError(400, "Username is taken");
            }
            if (same.email.toLowerCase() == req.body.email.toLowerCase()) {
                throw new HttpError(400, "Email is taken");
            }
        }

        user = await db.queryOne(`
            INSERT INTO users
            (username, firstname, lastname, email, phone, prof_pic_url, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [
            req.body.username, req.body.firstname, req.body.lastname,
            req.body.email, req.body.phone, req.body.profPicUrl,
            new Date(),
        ], client);
        if (!user) {
            throw new HttpError(400, "Invalid user info");
        }

        let passwordEntry = db.queryOne(`
            INSERT INTO password_entries
            (user_id, password_hash)
            VALUES ($1, $2)
            RETURNING *
        `, [user.id, passwordHash], client);
        if (!passwordEntry) {
            throw new HttpError(400, "Error creating user");
        }

    });

    res.json(user);

}));

router.get("/users", checkBody(), requireLogin, handler(async function(req, res) {

    let users = await db.queryAll("SELECT * FROM users");

    res.json(users);

}));

router.get("/users/id/:userId", checkBody(), requireLogin, handler(async function(req, res) {

    let user = await db.queryOne(`
        SELECT * FROM users WHERE id = $1
    `, [req.params.userId]);

    res.json(user);

}));

router.get("/users/search", checkBody({
    search: types.string,
}), requireLogin, handler(async function(req, res) {

    let regexString = String(req.query.search).trim().replace(/\s+/g, "|");

    let users = await db.queryAll(`
        SELECT *
        FROM users
        WHERE firstname ~* $1 OR lastname ~* $1
        LIMIT 10
    `, [regexString]);

    res.json(users);

}));

router.put("/password", checkBody({
    oldPassword: types.string,
    newPassword: types.string,
}), requireLogin, handler(async function(req, res) {

    // This transaction should use explicit locking (FOR NO KEY UPDATE) instead
    // of a serializable transaction. This is because comparing the supplied
    // old password and the true password hash has to happen in between the
    // SELECT and the UPDATE, and this comparison takes significant work. It's
    // no good for there to be any needless repetition of hashing going on.

    await db.transaction(async client => {

        let passwordEntry = await db.queryOne(`
            SELECT *
            FROM password_entries
            WHERE user_id = $1
            FOR NO KEY UPDATE
        `, [req.user.id], client);

        if (!(await util.auth.checkPassword(req.body.oldPassword, passwordEntry.passwordHash))) {
            throw new HttpError(403, "Your old password is incorrect");
        }

        let newPasswordHash = await util.auth.generatePasswordHash(req.body.newPassword);

        await db.queryOne(`
            UPDATE password_entries
            SET password_hash = $1
            WHERE user_id = $2
        `, [newPasswordHash, req.user.id], client);

    });

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
        throw new HttpError(400, "Invalid email address");
    }
    if (!util.validatePhone(req.body.phone)) {
        throw new HttpError(400, "Invalid phone number");
    }

    let user = await db.queryOne(`
        UPDATE users
        SET firstname = $1, lastname = $2, email = $3, phone = $4, prof_pic_url = $5
        WHERE id = $6
        RETURNING *
    `, [
        req.body.firstname, req.body.lastname, req.body.email, req.body.phone, req.body.profPicUrl,
        req.user.id,
    ]);

    res.json(user);

}));

// get information about the currently logged in user
router.get("/users/self", checkBody(), requireLogin, handler(async function(req, res) {
    res.json(req.user);
}));


module.exports = router;
