"use strict";

let mongoose = require("mongoose");

let Schema = mongoose.Schema;
let ObjectId = Schema.Types.ObjectId;

let User = require("./User");

let chatSchema = new Schema({
    creator: {
        type: ObjectId,
        ref: "User",
    },
    isTwoPeople: Boolean,
    isAllUsers: Boolean,
    users: [{
        type: ObjectId,
        ref: "User",
    }],
    name: {
        type: String,
    },
    unreadMessages: [{
        user: {
            type: ObjectId,
            ref: "User",
        },
        number: Number,
    }],
    messages: {
        type: [{
            author: {
                type: ObjectId,
                ref: "User",
            },
            content: String,
            timestamp: Date,
        }],
        select: false,
    },
    created_at: Date,
    updated_at: Date,
});

chatSchema.pre("save", async function(next) {
    let now = new Date();
    if (!this.unchangedUpdatedAt) {
        this.updated_at = now;
    }
    if (!this.created_at) {
        this.created_at = now;
    }
    if (this.isNew) {
        await this.updateUnread();
    }
    next();
});

chatSchema.methods.updateUnread = async function(userId) {
    if (userId) {
        if (this.unreadMessages.findIndex(elem =>
            elem.user.toString() === userId.toString()) === -1
        ) {
            this.unreadMessages.push({ user: userId, number: this.messages.length })
        }
    } else {
        let users;
        if (this.isAllUsers) {
            users = await User.find();
        } else {
            users = this.users;
        }
        for (let user of users) {
            if (this.unreadMessages.findIndex(elem =>
                elem.user.toString() === user._id.toString()) === -1
            ) {
                this.unreadMessages.push({ user: user._id, number: this.messages.length })
            }
        }
    }
    this.unchangedUpdatedAt = true;
    // this.save();
};

let Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
