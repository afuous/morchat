"use strict";

let io = global.io;

let express = require("express");
let fs = require("fs");
let bodyParser = require("body-parser");
let compression = require("compression");
let util = require("./util");
let sio = require("./sio");
let db = require("./util/db");

// main app that is exported
let app = express();

app.use("/api/*", (req, res, next) => {
    // this is for the mobile website
    res.set({
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Origin": "*",
    });
    if (req.headers["authorization"]) {
        // Authorization: Bearer <cookie here, name=value>
        req.headers["cookie"] = req.headers["authorization"].split(" ")[1] + ";";
    }
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(compression({
    filter: (req, res) => (
        req.path.startsWith("/api") || req.path.startsWith("/js")
    ),
}));

app.use(util.sessionMiddleware);

app.use(async function(req, res, next) {
    if (req.session && req.session.userId) {
        try {
            req.user = await db.queryOne("SELECT * FROM users WHERE id = $1", [req.session.userId]);
            next();
        } catch (err) {
            // TODO: handle more cleanly the case where userId is not found for if the user is deleted or something
            console.error(err);
            res.end("fail");
        }
    } else {
        next();
    }
});

let webDir = require("path").join(__dirname, "../../web");
let publicDir = webDir + "/public";
app.use(express.static(publicDir));

// check to see if user is logged in before continuing any further
// allow browser to receive images, css, and js files without being logged in
// allow browser to receive some pages such as login, signup, etc. without being logged in
app.use(function(req, res, next) {
    if (req.method != "GET") {
        return next();
    }

    // TODO: I don't think this whole middleware is necessary at all
    // return next();

    let path = req.path;

    if (path.startsWith("/js")) {
        return next();
    }

    let exceptions = [
        "/login",
        "/signup",
        "/fp",
    ];

    if (exceptions.indexOf(path) > -1) {
        return next();
    }

    if (!req.user) {
        return res.redirect("/login");
    }

    next();
});

// use EJS as default view engine and specifies location of EJS files
app.set("view engine", "ejs");
//	router.set("views", require("path").join(__dirname, "/../website"));

app.use(require("./views"));

let api = express.Router();
// import all modules that handle specific requests
api.use(require("./users"));
api.use(require("./announcements"));
api.use(require("./chat"));

app.use("/api", api);

// send 404 message for any page that does not exist (IMPORTANT: The order for this does matter. Keep it at the end.)
app.use("*", function(req, res) { // TODO: should this be get or use?
    util.send404(res);
});

console.log("MorChat started");

module.exports = {
    app: app,
    sioOnConnection: sio.onConnection,
};
