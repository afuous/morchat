"use strict";

const http = require("http");

const morimg = require("./src/server");

const server = http.createServer(morimg.app);
server.listen(process.argv[2] || 80);
