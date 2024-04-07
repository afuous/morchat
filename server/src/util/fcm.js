"use strict";

let fs = require("fs");
let googleapis = require("googleapis");
let config = require("./config");

let fcm = {};

let googleServiceAccountKeyPath = require("path").join(__dirname, "../../googleServiceAccountKey.json");
let googleServiceAccountKey = null;
let jwtClient = null;
if (fs.existsSync(googleServiceAccountKeyPath)) {
    googleServiceAccountKey = JSON.parse(fs.readFileSync(googleServiceAccountKeyPath));
    jwtClient = new googleapis.google.auth.JWT(
        googleServiceAccountKey.client_email,
        null,
        googleServiceAccountKey.private_key,
        ["https://www.googleapis.com/auth/firebase.messaging"],
        null
    );
}

fcm.sendNotification = async function(mobileDeviceToken, numUnread) {
    if (!googleServiceAccountKey || !jwtClient) {
        return;
    }
    if (numUnread == 0) {
        return;
    }

    let accessToken = await new Promise(function(resolve, reject) {
        jwtClient.authorize(function(err, tokens) {
            if (err) {
                reject(err);
            } else {
                resolve(tokens.access_token);
            }
        });
    });

    require("https").request({
        host: "fcm.googleapis.com",
        path: "/v1/projects/" + googleServiceAccountKey.project_id + "/messages:send",
        method: "POST",
        headers: {
            "Authorization": "Bearer " + accessToken,
            "Content-type": "application/json",
        },
    }, function(response) {
        // idk what to do here
        // it's not the end of the world if one notification fails
        // but it is an issue if many fail
        // should probably log it
    }).end(JSON.stringify({
        // https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages
        message: {
            token: mobileDeviceToken,
            android: {
                notification: {
                    title: "",
                    body: numUnread + " unread messages",
                    // https://github.com/fechanique/cordova-plugin-fcm/issues/109#issuecomment-292465898
                    tag: "collapse",
                },
                // always set the collapse key and tag to "collapse"
                // not entirely sure how these work but there is a limit to the number of collapse keys in firebase
                // so just always use one collapse key no matter what to make sure the limit is never hit
                collapse_key: "collapse",
            },
        }
    }));
};

module.exports = fcm;
