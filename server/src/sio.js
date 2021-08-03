"use strict";

let util = require("./util");
let db = util.db;


// { [userId]: [ { chatIds: [ObjectId], sockets: [Socket] } ] }
let onlineClients = {};


let sio = {};

let emitToUsers = async function(userIds, name, data, except) {
    // except is either undefined or a socket
    for (let userId of userIds) {
        if (userId in onlineClients) {
            for (let sock of onlineClients[userId].sockets) {
                if (sock != except) {
                    sock.emit(name, data);
                }
            }
        }
    }
};

sio.onConnection = function(socket) {

    if (socket.request.headers["authorization"]) {
        socket.request.headers["cookie"] = socket.request.headers["authorization"].split(" ")[1] + ";";
    }

    util.sessionMiddleware(socket.request, socket.request.res, async function() {

        let sess = socket.request.session.userId && (await db.queryOne(`
            SELECT *
            FROM users
            WHERE id = $1
        `, [socket.request.session.userId]));
        if (!sess) {
            return;
        }

        try {

            if (!(sess.id in onlineClients)) { // later

                let chats = await db.queryAll(`
                    SELECT chats.*
                    FROM chats, chat_users
                    WHERE chat_users.chat_id = chats.id AND chat_users.user_id = $1
                `, [sess.id]);

                let chatIds = chats.map(chat => chat.id);

                for (let userId in onlineClients) {
                    for (let sock of onlineClients[userId].sockets) {
                        sock.emit("joined", {
                            id: sess.id,
                        });
                    }
                }
                onlineClients[sess.id] = {
                    chatIds: chatIds,
                    sockets: [],
                };
            }
            onlineClients[sess.id].sockets.push(socket);

        } catch (err) {
            console.error(err);
        }

        socket.on("disconnect", function() {
            if (!sess || !(sess.id in onlineClients)) {
                // TODO: sometimes onlineClients[sess._id] doesnt exist
                // (maybe because it takes time for the mongo query to execute
                // and add user chats to the onlineClients object at the sess._id index)
                return;
            }

            onlineClients[sess.id].sockets = onlineClients[sess.id].sockets.filter(s => s != socket);

            if (onlineClients[sess.id].sockets.length == 0) {

                delete onlineClients[sess.id];

                for (let userId in onlineClients) {
                    for (let sock of onlineClients[userId].sockets) {
                        sock.emit("left", {
                            id: sess.id,
                        });
                    }
                }

            }
        });

        socket.on("sendMessage", async function(data) {

            let now = new Date();
            // TODO: DONT REMOVE HTML HERE DO IT ON THE CLIENT
            let content = util.removeHTML(data.content);
            let chatId = data.chatId;

            let message;
            let chatUsers;
            let chat;
            let unreadMessageCounts;

            try {
                await db.transactionSerializable(async client => {

                    if (!await db.queryOne(`
                        SELECT *
                        FROM chat_users
                        WHERE user_id = $1 AND chat_id = $2
                    `, [sess.id, chatId], client)) {
                        throw new HttpError();
                    }

                    // TODO: updated_at
                    // can there be an inner join after the returning * ?
                    message = await db.queryOne(`
                        INSERT INTO chat_messages
                        (chat_id, author_id, content, created_at)
                        VALUES ($1, $2, $3, $4)
                        RETURNING *
                    `, [chatId, sess.id, content, now], client);
                    message.author = sess;

                    chatUsers = await db.queryAll(`
                        UPDATE chat_users
                        SET unread_messages = unread_messages + 1
                        WHERE chat_id = $1 and user_id != $2
                        RETURNING *
                    `, [chatId, sess.id], client);

                    chat = await db.queryOne(`
                        SELECT *
                        FROM chats
                        WHERE id = $1
                    `, [chatId], client);

                    // TODO: is the order wrong, should the mobile device token be added in another inner join afterward?
                    // i think it might be ok actually
                    unreadMessageCounts = await db.queryAll(`
                        SELECT DISTINCT mdt.token, sum(cu1.unread_messages) OVER (PARTITION BY cu1.user_id) AS total_unread
                        FROM chat_users as cu1, chat_users as cu2, mobile_device_tokens as mdt
                        WHERE cu2.chat_id = $1
                        AND cu1.user_id = cu2.user_id
                        AND cu1.user_id = mdt.user_id
                    `, [chatId], client);

                    await db.queryOne(`
                        UPDATE chats
                        SET updated_at = $1
                        WHERE id = $2
                    `, [new Date(), chatId], client);

                });
            } catch (e) {
                // whatever
                if (!(e instanceof util.HttpError)) {
                    throw e;
                }
            }

            emitToUsers(chatUsers.map(obj => obj.userId).concat([sess.id]), "message", {
                chatId: chatId,
                message: message,
                isTwoPeople: chat.isTwoPeople,
                name: chat.name,
            }, socket);

            socket.emit("message-sent", {
                chatId: chatId,
                content: content,
                timestamp: now,
            });

            // push notifications
            for (let obj of unreadMessageCounts) {
                util.fcm.sendNotification(obj.token, obj.totalUnread);
            }

        });

        socket.on("read message", async function(data) {
            let chatId = data.chatId;

            await db.queryOne(`
                UPDATE chat_users
                SET unread_messages = 0
                WHERE user_id = $1 and chat_id = $2
            `, [sess.id, chatId]);
        });

        // TODO: if a user has multiple clients and sends a message, display sent message on all clients

        socket.on("get clients", function() {
            socket.emit("get clients", Object.keys(onlineClients).map(str => parseInt(str)));
        });

        socket.on("start typing", function(data) {
            for (let userId of Object.keys(onlineClients)) {
                if (onlineClients[userId].chatIds.indexOf(data.chatId) != -1 && userId != sess.id) {
                    for (let sock of onlineClients[userId].sockets) {
                        sock.emit("start typing", data);
                    }
                }
            }
        });

        socket.on("stop typing", function(data) {
            for (let userId of Object.keys(onlineClients)) {
                if (onlineClients[userId].chatIds.indexOf(data.chatId) != -1 && userId != sess.id) {
                    for (let sock of onlineClients[userId].sockets) {
                        sock.emit("stop typing", data);
                    }
                }
            }
        });

    });

};

sio.createChat = async function(chat) {
    return await emitToUsers(chat.users.map(user => user.id), "addChat", {
        chat: chat,
    });
};

sio.renameChat = async function(chat) {
    return await emitToUsers(chat.userIds, "renameChat", {
        chatId: chat.id,
        name: chat.name,
    });
};


module.exports = sio;
