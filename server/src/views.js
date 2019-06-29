"use strict";

let express = require("express");
let Promise = require("bluebird");
let fs = require("fs");
let util = require("./util");
let handler = util.handler;

let webDir = require("path").join(__dirname, "../../web");


let router = express.Router();

let pages = {
    signup: "Signup",
    login: "Login",
    "": "Home", // this works
    chat: "Chat",
    fp: "Fp",
    allUsers: "AllUsers",
};

let renderPage = Promise.coroutine(function*(res, page, user, options) {
    res.render(webDir + "/src/page.html.ejs", {
        options: options || {},
        userInfo: user,
        page: page,
    });
});

for (let page in pages) {
    router.get("/" + page, handler(function*(req, res) {
        renderPage(res, pages[page], req.user);
    }));
}

router.get("/profiles/id/:userId", handler(function*(req, res) {
    renderPage(res, "User", req.user, {
        userId: req.params.userId,
    });
}));

router.use("/js", express.static(webDir + "/build"));

module.exports = router;
