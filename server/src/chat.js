"use strict";

let express = require("express");
let util = require("./util");
let sio = require("./sio");

let handler = util.handler;
let requireLogin = util.requireLogin;
let checkBody = util.middlechecker.checkBody;
let types = util.middlechecker.types;
let HttpError = util.HttpError;
let db = util.db;


async function getChat(chatId, userId, client) {
    let chat = await db.queryOne(`
        SELECT chats.*
        FROM chats, chat_users
        WHERE chats.id = $1 AND chat_users.chat_id = chats.id AND chat_users.user_id = $2
    `, [chatId, userId], client);
    if (!chat) {
        throw new HttpError(400, "Chat does not exist"); // or no permission to view it
    }
    return chat;
}


let router = express.Router();

router.post("/chats", checkBody(types.union([{
    isTwoPeople: types.value(true),
    otherUserId: types.integer,
}, {
    isTwoPeople: types.value(false),
    users: [types.integer],
    name: types.string,
}])), requireLogin, handler(async function(req, res) {

    if (req.body.isTwoPeople) {

        let otherUser;
        let chat;

        await db.transactionSerializable(async client => {

            otherUser = await db.queryOne(`
                SELECT *
                FROM users
                WHERE id = $1
            `, [req.body.otherUserId], client);
            if (!otherUser) {
                throw new HttpError(400, "That user does not exist");
            }

            let alreadyExists = await db.queryOne(`
                SELECT c.id
                FROM chats as c, chat_users as cu
                WHERE c.is_two_people AND c.id = cu.chat_id AND cu.user_id = $1
                INTERSECT
                SELECT c.id
                FROM chats as c, chat_users as cu
                WHERE c.is_two_people AND c.id = cu.chat_id AND cu.user_id = $2
            `, [req.user.id, otherUser.id], client);
            if (alreadyExists) {
                throw new HttpError(400, "This chat already exists");
            }

            chat = await db.queryOne(`
                INSERT INTO chats
                (creator_id, is_two_people, created_at, updated_at)
                VALUES ($1, $2, $3, $3)
                RETURNING *
            `, [req.user.id, true, new Date()], client);

            let entries = await db.queryAll(`
                INSERT INTO chat_users
                (chat_id, user_id, unread_messages)
                VALUES ($1, $2, $3), ($4, $5, $6)
                RETURNING *
            `, [chat.id, req.user.id, 0, chat.id, otherUser.id, 0], client);
            if (entries.length != 2) {
                throw new HttpError(500, "Error creating chat");
            }

        });

        chat.users = [req.user, otherUser];

        await sio.createChat(chat);
        res.json(chat);

    } else {

        if (req.body.users.indexOf(req.user.id) == -1) {
            req.body.users.push(req.user.id);
        }

        if (req.body.name.length >= 20) {
            throw new HttpError(400, "The chat name has to be 19 characters or fewer");
        }

        let chat;

        await db.transactionSerializable(async client => {

            let users = await db.queryAll(`
                SELECT *
                FROM users
                WHERE id IN (SELECT * FROM UNNEST ($1::int[]))
            `, [req.body.users], client);

            if (users.length != req.body.users.length) {
                throw new HttpError(400, "There is an invalid user id");
            }

            chat = await db.queryOne(`
                INSERT INTO chats
                (creator_id, is_two_people, name, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $4)
                RETURNING *
            `, [req.user.id, false, req.body.name, new Date()], client);
            chat.users = users;

            // https://github.com/brianc/node-postgres/issues/957#issuecomment-295583050
            await db.queryOne(`
                INSERT INTO chat_users
                (chat_id, user_id, unread_messages)
                SELECT * FROM UNNEST($1::int[], $2::int[], $3::int[])
            `, [
                req.body.users.map(userId => chat.id),
                req.body.users.map(userId => userId),
                req.body.users.map(userId => 0),
            ], client);

        });

        await sio.createChat(chat);
        res.json(chat);
    }

}));

router.get("/chats", checkBody(), requireLogin, handler(async function(req, res) {

    let chats;

    await db.transaction(async client => {

        chats = await db.queryAll(`
            SELECT chats.*, chat_users.unread_messages
            FROM chats, chat_users
            WHERE chat_users.chat_id = chats.id AND chat_users.user_id = $1
            ORDER BY chats.updated_at DESC
        `, [req.user.id], client);

        let chatUsers = await db.queryAllCollectUser("user", `
            SELECT chat_users.chat_id, ${db.aliasUserJoin("user")}
            FROM chat_users, users
            WHERE chat_users.user_id = users.id
            AND chat_users.chat_id in (SELECT * FROM UNNEST ($1::int[]))
        `, [chats.map(chat => chat.id)], client);

        for (let chat of chats) {
            chat.users = [];
        }
        for (let chatUser of chatUsers) {
            chats.find(chat => chat.id == chatUser.chatId).users.push(chatUser.user);
        }

    });

    res.json(chats);

}));

router.get("/chats/id/:chatId/messages", checkBody({
    skip: types.string,
}), requireLogin, handler(async function(req, res) {

    let skip = parseInt(req.query.skip);

    let messages = await db.transaction(async client => {

        let chat = await getChat(req.params.chatId, req.user.id, client);

        return await db.queryAllCollectUser("author", `
            SELECT chat_messages.*, ${db.aliasUserJoin("author")}
            FROM chat_messages, users
            WHERE chat_messages.chat_id = $1 AND chat_messages.author_id = users.id
            ORDER BY created_at DESC
            OFFSET $2
            LIMIT $3
        `, [chat.id, skip, 20], client);

    });

    res.json(messages);

}));

router.get("/chats/id/:chatId/users", checkBody(), requireLogin, handler(async function(req, res) {

    let users = await db.transaction(async client => {

        let chat = await getChat(req.params.chatId, req.user.id, client);

        let arr = await db.queryAllCollectUser("user", `
            SELECT ${db.aliasUserJoin("user")}
            FROM chat_users, users
            WHERE chat_users.chat_id = $1 AND chat_users.user_id = user.id
        `, [req.params.chatId], client);
        return arr.map(obj => obj.user);

    });

    res.json(users);

}));

router.put("/chats/id/:chatId/name", checkBody({
    newName: types.string,
}), requireLogin, handler(async function(req, res) {

    if (req.body.newName.length >= 20) {
        throw new HttpError(400).end("Chat name has to be 19 characters or fewer");
    }

    let chat;
    let userIds;

    await db.transactionSerializable(async client => {

        chat = await getChat(req.params.chatId, req.user.id, client);
        if (chat.isTwoPeople) {
            throw new HttpError(400, "This chat cannot be renamed");
        }

        chat = await db.queryOne(`
            UPDATE chats
            SET name = $1
            WHERE id = $2
            RETURNING *
        `, [req.body.newName, chat.id], client);

        let chatUsers = (await db.queryAll(`
            SELECT user_id
            FROM chat_users
            WHERE chat_id = $1
        `, [req.params.chatId], client));
        chat.userIds = chatUsers.map(chatUser => chatUser.userId);

    });

    await sio.renameChat(chat);
    res.end();

}));

router.get("/chats/id/:chatId/log", handler(async function(req, res) {

    function pad(n) {
        if (n < 10) {
            return "0" + n;
        } else {
            return n;
        }
    }

    // TODO: is it ok to have a transaction that lasts this long?

    await db.transaction(async client => {

        let chat = await getChat(req.params.chatId, req.user.id, client);

        let chatTitle;
        if (chat.isTwoPeople) {

            let userIds = await db.queryAll(`
                SELECT *
                FROM chat_users
                WHERE chat_id = $1
            `, [chat.id], client).map(obj => obj.userId);

            let otherUserId = userIds.find(userId => userId != req.user.id);

            let otherUser = await db.queryOne(`
                SELECT *
                FROM users
                WHERE id = $1
            `, [otherUserId], client);

            chatTitle = otherUser.firstname + " " + otherUser.lastname;

        } else {
            chatTitle = chat.name;
        }

        res.setHeader("Content-type", "text/plain");
        res.setHeader("Content-disposition", "attachment; filename=" + chatTitle + ".log");


        const chunkSize = 1000;
        let numSeen = 0;

        while (true) {

            let messages = await db.queryAllCollectUser("author", `
                SELECT chat_messages.*, ${db.aliasUserJoin("author")}
                FROM chat_messages, users
                WHERE chat_messages.chat_id = $1 AND chat_messages.author_id = users.id
                ORDER BY created_at ASC
                OFFSET $2
                LIMIT $3
            `, [req.params.chatId, numSeen, chunkSize], client);

            if (messages.length == 0) {
                break;
            }

            for (let message of messages) {
                numSeen++;

                let authorName = message.author.firstname + " " + message.author.lastname[0];
                let date = new Date(message.createdAt);
                res.write(
                    numSeen + " ".repeat(8 - numSeen.toString().length)
                    + date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) + " "
                    + pad(date.getHours()) + ":" + pad(date.getMinutes()) + ":" + pad(date.getSeconds()) + " "
                    + authorName + " ".repeat(12 - authorName.length) + " "
                    + message.content + "\n"
                );
            }

        }

    });

    res.end();

}));

module.exports = router;
