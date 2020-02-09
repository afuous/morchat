"use strict";

let socketio = require("socket.io");
let http = require("http");

let morchat = require("./src/server");
let server = http.createServer((req, res) => {
    morchat.app(req, res);
});
server.listen(process.argv[2] || 80);
let io = socketio.listen(server, {
    // https://github.com/socketio/socket.io-client/issues/1140#issuecomment-325958737
    handlePreflightRequest: (req, res) => {
        res.writeHead(200, {
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Origin": "*",
        });
        res.end();
    },
});

io.on("connection", morchat.sioOnConnection);
