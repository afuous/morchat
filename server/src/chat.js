"use strict";

let express = require("express");
let ObjectId = require("mongoose").Types.ObjectId;
let util = require("./util");

let handler = util.handler;
let requireLogin = util.requireLogin;
let checkBody = util.middlechecker.checkBody;
let types = util.middlechecker.types;
let sio = require("./sio");

let Chat = require("./models/Chat");
let User = require("./models/User");


let router = express.Router();

router.post("/chats", checkBody(types.union([{
    isTwoPeople: types.value(true),
    otherUserId: types.objectId(User),
}, {
    isAllUsers: types.value(true),
}, {
    isTwoPeople: types.value(false),
    isAllUsers: types.value(false),
    users: [types.objectId(User)],
    name: types.string,
}])), requireLogin, handler(async function(req, res) {

    if (req.body.isTwoPeople) {

        let otherUser = await User.findOne({
            _id: req.body.otherUserId,
        });
        if (!otherUser) {
            return res.status(400).end("That user does not exist");
        }

        // check to see if already exists
        if ((await Chat.count({
            isTwoPeople: true,
            users: [req.user._id, req.body.otherUserId], // TODO: does this need to be an or with both orders
        })) > 0) {
            return res.status(400).end("This chat already exists");
        }

        let chat = await Chat.create({
            isTwoPeople: true,
            isAllUsers: false,
            users: [
                req.user._id,
                req.body.otherUserId,
            ],
        });

        chat.users = [req.user, otherUser];

        await sio.createChat(chat);
        res.json(chat);

    } else if (req.body.isAllUsers) {

        let chat = await Chat.create({
            isAllUsers: true,
            isTwoPeople: false,
            name: req.body.name,
        });

        await sio.createChat(chat);
        res.json(chat);

    } else {

        if (req.body.users.indexOf(req.user._id.toString()) == -1) {
            req.body.users.push(req.user._id);
        }

        if (req.body.name.length >= 20) {
            return res.status(400).end("The chat name has to be 19 characters or fewer");
            // TODO: get rid of this...
        }

        let users = await User.find({
            _id: {
                $in: req.body.users,
            },
        });

        if (users.length != req.body.users.length) {
            return res.status(400).end("There is an invalid user id");
        }

        let chat = await Chat.create({
            isTwoPeople: false,
            isAllUsers: false,
            name: req.body.name,
            users: req.body.users,
        });

        chat.users = users;

        await sio.createChat(chat);
        res.json(chat);
    }

}));

router.get("/chats", checkBody(), requireLogin, handler(async function(req, res) {

    // find a chat that has said user as a member
    let chats = await Chat.find({
        users: req.user,
    }, {
        _id: 1,
        name: 1,
        users: 1,
        isTwoPeople: 1,
        updated_at: 1,
        messages: 1,
        unreadMessages: 1,
    })
        .slice("messages", [0, 1])
        .sort("-updated_at")
        .populate("messages.author users")
        .exec();
    // ^ the code above gets the latest message from the chat (for previews in iOS and Android) and orders the list by most recent.

    // for (let chat of chats) {
    //     await chat.updateUnread();
    // }
    await Promise.all(chats.map(chat => chat.updateUnread()));

    res.json(chats);

}));

router.get("/chats/id/:chatId/messages", checkBody({
    skip: types.string,
}), requireLogin, handler(async function(req, res) {

    let skip = parseInt(req.query.skip);

    // loads 20 messages after skip many messages. example: if skip is 0, it loads messages 0-19, if it"s 20, loads 20-39, etc.
    let chat = await Chat.findOne({
        _id: req.params.chatId,
        users: req.user._id,
    })
        .select("+messages")
        .slice("messages", [skip, 20])
        .populate("messages.author")
        .exec();

    res.json(chat.messages);

}));

router.get("/chats/id/:chatId/users", checkBody(), requireLogin, handler(async function(req, res) {

    let chat = await Chat.findOne({
        _id: req.params.chatId,
        users: req.user._id,
    });

    let users = await User.find({
        _id: {
            $in: chat.users,
        },
    });

    res.json(users);

}));

router.put("/chats/id/:chatId/name", checkBody({
    newName: types.string,
}), requireLogin, handler(async function(req, res) {

    if (req.body.newName.length >= 20) {
        return res.status(400).end("Chat name has to be 19 characters or fewer");
    }

    let chat = await Chat.findOne({
        _id: req.params.chatId,
        users: req.user._id,
    });

    if (!chat) {
        return res.status(404).end("This chat does not exist");
    }

    if (chat.isTwoPeople) {
        return res.status(400).end("This chat cannot be renamed");
    }

    chat.name = req.body.newName;

    await chat.save();

    await sio.renameChat(chat);
    res.end();

}));

module.exports = router;
