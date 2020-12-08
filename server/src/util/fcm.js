"use strict";

let webPush = require("web-push");

let User = require("../models/User");
let config = require("./config");

let fcm = {};

fcm.sendNotifications = function(user, numUnread, preview) {
    fcm.sendFcmNotifications(user, numUnread);
    fcm.sendWebPushNotifications(user, numUnread, preview);
};

fcm.sendFcmNotifications = function(user, numUnread) {
    if (!config.fcmServerKey) {
        return;
    }
    if (!user.mobileDeviceTokens || user.mobileDeviceTokens.length == 0) {
        return;
    }
    if (numUnread == 0) {
        return;
    }

    require("https").request({
        host: "fcm.googleapis.com",
        path: "/fcm/send",
        method: "POST",
        headers: {
            "Authorization": "key=" + config.fcmServerKey,
            "Content-type": "application/json",
        },
    }, function(response) {
        // idk what to do here
        // it's not the end of the world if one notification fails
        // but it is an issue if many fail
        // should probably log it
    }).end(JSON.stringify({
        registration_ids: user.mobileDeviceTokens,
        notification: {
            title: "",
            body: numUnread + " unread messages",
            // https://github.com/fechanique/cordova-plugin-fcm/issues/109#issuecomment-292465898
            tag: "collapse",
            // https://stackoverflow.com/a/48923162
            renotify: true,
        },
        // always set the collapse key and tag to "collapse"
        // not entirely sure how these work but there is a limit to the number of collapse keys in firebase
        // so just always use one collapse key no matter what to make sure the limit is never hit
        collapse_key: "collapse",
    }));
};

if (config.webPushPublicKey && config.webPushPrivateKey) {
    webPush.setVapidDetails("mailto:", config.webPushPublicKey, config.webPushPrivateKey);
}

fcm.sendWebPushNotifications = function(user, numUnread, preview) {
    if (!config.webPushPublicKey || !config.webPushPrivateKey) {
        return;
    }

    if (!user.webPushSubscriptionStrs || user.webPushSubscriptionStrs.length == 0) {
        return;
    }

    if (numUnread == 0) {
        return;
    }

    for (let subscriptionStr of user.webPushSubscriptionStrs) {
        try {
            webPush.sendNotification(JSON.parse(subscriptionStr), "(" + numUnread + ") " + preview);
        } catch (e) {}
    }
};

module.exports = fcm;
