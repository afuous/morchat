"use strict";

let express = require("express");
let ObjectId = require("mongoose").Types.ObjectId;
let util = require("./util");

let handler = util.handler;
let requireLogin = util.requireLogin;
let checkBody = util.middlechecker.checkBody;
let types = util.middlechecker.types;

let Announcement = require("./models/Announcement");


let router = express.Router();

router.post("/announcements", checkBody({
    content: types.string,
}), requireLogin, handler(async function(req, res) {

    let announcement = await Announcement.create({
        author: req.user._id,
        content: req.body.content,
        timestamp: new Date(),
    });

    announcement.author = req.user;

    res.json(announcement);

}));

router.get("/announcements", checkBody({
    skip: types.string,
}), requireLogin, handler(async function(req, res) {

    // find announcements that the user should be able to see
    let announcements = await Announcement.find({}, {
        // only respond with _id, author, content and timestamp
        _id: 1,
        author: 1,
        content: 1,
        timestamp: 1,
    }) // populate author and sort by timestamp, skip and limit are for pagination
        .populate("author")
        .sort("-timestamp")
        .skip(parseInt(req.query.skip))
        .limit(20)
        .exec();

    res.json(announcements);

}));

router.delete("/announcements/id/:announcementId", checkBody(), requireLogin, handler(async function(req, res) {

    let announcement = await Announcement.findOne({
        _id: req.params.announcementId,
    });

    // check if user is eligible to delete said announcement
    if (req.user._id == announcement.author.toString()) {
        await announcement.remove();
        res.end();
    } else {
        // warn me about attempted hax, bruh
        res.status(403).end("You do not have permission to do this");
        await util.mail.sendEmail({
            to: "rafezyfarbod@gmail.com",
            subject: "MorTeam Security Alert!",
            text: "The user " + req.user.firstname + " " + req.user.lastname + " tried to perform administrator tasks. User ID: " + req.user._id
        });
    }

}));

module.exports = router;
