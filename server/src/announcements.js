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

router.post("/announcements", checkBody({
    content: types.string,
}), requireLogin, handler(async function(req, res) {

    let announcement = await db.queryOne(`
        INSERT INTO announcements
        (author_id, content, created_at)
        VALUES ($1, $2, $3)
        RETURNING *
    `, [req.user.id, req.body.content, new Date()]);

    delete announcement.authorId;
    announcement.author = req.user;

    res.json(announcement);

}));

// TODO: make req.body.skip a number instead of a string, no more need for urlencoded request body
router.get("/announcements", checkBody({
    skip: types.string,
}), requireLogin, handler(async function(req, res) {

    let announcements = await db.queryAllCollectUser("author", `
        SELECT announcements.*, ${db.aliasUserJoin("author")}
        FROM announcements
        INNER JOIN users
        ON announcements.author_id = users.id
        ORDER BY created_at DESC
        OFFSET $1
        LIMIT $2
    `, [parseInt(req.query.skip), 20]);

    res.json(announcements);

}));

router.delete("/announcements/id/:announcementId", checkBody(), requireLogin, handler(async function(req, res) {

    let announcement = await db.queryOne(`
        DELETE FROM announcements
        WHERE id = $1 AND author_id = $2
        RETURNING *
    `, [req.params.announcementId, req.user.id]);

    if (!announcement) {
        throw new HttpError(400, "Deleting announcement failed");
    }

    res.end();

}));

module.exports = router;
