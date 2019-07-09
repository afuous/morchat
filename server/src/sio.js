"use strict";

let ObjectId = require("mongoose").Types.ObjectId;

let util = require("./util");

let Chat = require("./models/Chat");
let User = require("./models/User");


// { [userId]: [ { chatIds: [ObjectId], sockets: [Socket] } ] }
let onlineClients = {};


let sio = {};

let emitToUsers = async function(userIds, name, data, except) {
    except = except && except.toString();
    for (let userId of userIds) {
        if (userId in onlineClients && userId != except) {
            for (let sock of onlineClients[userId].sockets) {
                sock.emit(name, data);
            }
        }
    }
};

sio.onConnection = function(socket) {

    util.sessionMiddleware(socket.request, socket.request.res, async function() {

        let sess = socket.request.session.userId && (await User.findOne({
            _id: socket.request.session.userId
        }));
        if (sess) {
            try {

                if (!(sess._id in onlineClients)) { // later

                    let chats = await Chat.find({
                        users: sess._id,
                    }, {
                        _id: 1,
                    });

                    let chatIds = chats.map(chat => chat._id.toString());

                    // TODO: why is this check even here?
                    for (let userId in onlineClients) {
                        if (onlineClients[userId].chatIds.hasAnythingFrom(chatIds)) {
                            for (let sock of onlineClients[userId].sockets) {
                                sock.emit("joined", {
                                    _id: sess._id,
                                });
                            }
                        }
                    }
                    onlineClients[sess._id] = {
                        chatIds: chatIds,
                        sockets: [],
                    };
                }
                onlineClients[sess._id].sockets.push(socket);

            } catch (err) {
                console.error(err);
            }
        }

        socket.on("disconnect", function() {
            if (!sess || !(sess._id in onlineClients)) {
                // TODO: sometimes onlineClients[sess._id] doesnt exist
                // (maybe because it takes time for the mongo query to execute
                // and add user chats to the onlineClients object at the sess._id index)
                return;
            }

            onlineClients[sess._id].sockets = onlineClients[sess._id].sockets.filter(s => s != socket);

            if (onlineClients[sess._id].sockets.length == 0) { // if no clients remain for the user

                let chatIds = onlineClients[sess._id].chatIds;
                delete onlineClients[sess._id]; // remove from online clients

                // TODO: again why this qualification
                for (let userId in onlineClients) { // notify other clients that they went offline
                    if (onlineClients[userId].chatIds.hasAnythingFrom(chatIds)) { // if they have any chats in common
                        for (let sock of onlineClients[userId].sockets) {
                            sock.emit("left", {
                                _id: sess._id,
                            });
                        }
                    }
                }

            }
        });

        socket.on("sendMessage", async function(data) {

            let now = new Date();
            let content = util.removeHTML(data.content);
            let chatId = data.chatId;

            await Chat.updateOne({
                _id: chatId,
                users: sess._id,
            }, {
                $push: {
                    messages: {
                        $each: [{
                            author: sess._id,
                            content: content,
                            timestamp: now,
                        }],
                        $position: 0,
                    },
                },
                updated_at: now,
            });

            let message = {
                author: sess,
                content: content,
                timestamp: now,
            };

            let chat = await Chat.findOne({
                _id: chatId,
            }, {
                users: 1,
                isTwoPeople: 1,
                name: 1,
                unreadMessages: 1,
            });

            let promises = [];
            for (let elem of chat.unreadMessages) {
                if (elem.user.toString() !== sess._id.toString()) {
                    promises.push(Chat.updateOne({
                        _id: chatId,
                        "unreadMessages.user": elem.user,
                    }, {
                        $inc: { "unreadMessages.$.number": 1 },
                    }))
                }
            }

            await Promise.all(promises);

            let chatData = {
                chatId: chatId,
                message: message,
                isTwoPeople: chat.isTwoPeople,
                name: chat.name,
            };

            emitToUsers(chat.users, "message", chatData, sess._id);

            socket.emit("message-sent", {
                chatId: chatId,
                content: content,
            });

        });

        socket.on("read message", async function(data) {
            let chatId = data.chatId;

            let chat = await Chat.findOne({
                _id: chatId,
            })

            await Chat.updateOne({
                $and: [
                    { _id: chatId },
                    { "unreadMessages.user": sess._id },
                ],
            }, {
                $set: { "unreadMessages.$.number": 0 },
            })
        })

        // TODO: if a user has multiple clients and sends a message, display sent message on all clients

        socket.on("get clients", function() {
            socket.emit("get clients", Object.keys(onlineClients));
        });

        socket.on("start typing", function(data) {
            for (let user_id of Object.keys(onlineClients)) {
                if (~onlineClients[user_id].chatIds.indexOf(data.chatId) && user_id != sess._id) {
                    for (let sock of onlineClients[user_id].sockets) {
                        sock.emit("start typing", data);
                    }
                }
            }
        });

        socket.on("stop typing", function(data) {
            for (let userId of Object.keys(onlineClients)) {
                if (onlineClients[userId].chatIds.indexOf(data.chatId) != -1 && userId != sess._id) {
                    for (let sock of onlineClients[userId].sockets) {
                        sock.emit("stop typing", data);
                    }
                }
            }
        });

    });

};

sio.createChat = async function(chat) {
    return await emitToUsers(chat.users.map(user => user._id), "addChat", {
        chat: chat,
    });
};

sio.renameChat = async function(chat) {
    return await emitToUsers(chat.users, "renameChat", {
        chatId: chat._id,
        name: chat.name,
    });
};


module.exports = sio;
