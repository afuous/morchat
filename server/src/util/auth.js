"use strict";

let bcrypt = require("bcryptjs");
let SALT_WORK_FACTOR = 10;

let auth = {};

auth.generatePasswordHash = async function(password) {
    let salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
    let hash = await bcrypt.hash(password, salt);
    return hash;
};

auth.checkPassword = async function(password, hash) {
    return await bcrypt.compare(password, hash);
};

module.exports = auth;
