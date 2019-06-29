"use strict";

let socketio = require("socket.io");
let http = require("http");

let morchat = require("./src/server");
let server = http.createServer((req, res) => {
    morchat.app(req, res);
});
server.listen(process.argv[2] || 80);
let io = socketio.listen(server);
io.on("connection", morchat.sioOnConnection);
