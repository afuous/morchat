"use strict";

const express = require("express");
const multer = require("multer");
const jsonwebtoken = require("jsonwebtoken");
const fs = require("fs");
const fsp = require("fs").promises;
const crypto = require("crypto");

let config;
const configPath = require("path").join(__dirname, "../config.json");
if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath));
} else {
    throw new Error("Morimg: missing config.json");
}

const dataDirectory = require("path").resolve(__dirname, "..", config.dataDirectory);

const jwtSecret = crypto.randomBytes(64);

const app = express();
app.disable('x-powered-by');

app.use((req, res, next) => {
    res.set({
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "*",
    });
    next();
});

function randomAlphanumeric(length) {
    const letters = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const str = letters + letters.toUpperCase() + numbers;
    return Array(length).fill(0).map(_ => str[Math.floor(Math.random() * str.length)]).join("");
}

app.post("/generateUploadUrlEnding", function(req, res) {
    const authToken = req.get("authorization")?.match(/^Bearer (.*)$/)?.[1];
    if (!authToken || !config.authTokens.includes(authToken)) {
        return res.status(403).end("missing authorization");
    }
    const token = jsonwebtoken.sign({
        canUpload: true,
    }, jwtSecret, {
        algorithm: "HS256",
        expiresIn: 60, // seconds
    });
    res.json({
        urlEnding: "/upload?token=" + token,
    });
});

app.post("/upload", function(req, res, next) {
    const token = req.query.token;
    try {
        if (!token) {
            throw new Error("missing token");
        }
        const payload = jsonwebtoken.verify(token, jwtSecret, {
            algorithms: ["HS256"],
        });
        if (!payload.canUpload) {
            throw new Error("missing canUpload");
        }
    } catch (err) {
        console.log(err);
        console.log("Token:", token);
        return res.status(403).end("missing authorization");
    }
    next();
}, multer({
    storage: multer.diskStorage({
        destination: dataDirectory,
        filename: function(req, file, cb) {
            const originalName = file.originalname;
            const mimeType = file.mimetype;
            const extension = {
                "image.png": ".png",
                "image/jpeg": ".jpg",
                "image/gif": ".gif",
                "image/avif": ".avif",
                "image/tiff": ".tiff",
                "image/bmp": ".bmp",
                "image/webp": ".webp",
                "image/apng": ".apng",
            }[mimeType] ?? originalName?.match(/(\.[a-zA-Z0-9]+)$/)?.[1];
            if (extension == null) {
                return cb(new Error("unsupported mime type: " + mimeType));
            }
            const fileName = randomAlphanumeric(16) + extension;
            req.fileName = fileName;
            cb(null, fileName);
        },
    }),
    limits: {
        fileSize: config.maxFileSizeMB * 1024 * 1024,
    },
}).single("file"), function(req, res) {
    res.json({
        path: "/f/" + req.fileName,
    });
});

app.get("/f/*", async function(req, res) {
    const fileName = req.params[0];
    const path = require("path").join(dataDirectory, fileName);

    try {
        await fsp.stat(path);
    } catch (err) {
        return res.status(404).end("not found");
    }

    res.setHeader("content-type", "image/png");
    fs.createReadStream(path).pipe(res);
});

app.use("*", function(req, res) {
    res.status(404).end("not found");
});

// express looks at the function.length, this has to take 4 arguments to be an error handler
app.use(function(err, req, res, next) {
    console.log(err);
    res.status(500).end("error: " + err.message);
});

module.exports.app = app;
