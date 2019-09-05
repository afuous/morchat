"use strict";

let http = require("http");
let WebSocket = require("ws");

let morchat = require("./src/server");
let server = http.createServer(morchat.app);
let wss = new WebSocket.Server({ server: server });
wss.on("connection", morchat.wsOnConnection);
server.listen(process.argv[2] || 80);
