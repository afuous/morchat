# MorChat

A chat application. Anybody can run an instance.

MorChat is a derivative of [MorTeam](https://github.com/mortorqrobotics/morteam-server), but with many of the team organization features removed, instead focusing on chat.

## How to run

1. Install node.js, npm, and mongodb.
2. Run `npm install` in `server` and `web`.
3. Run `npm run build` in `web`.
4. Ensure that a mongodb server is running.
5. To start the server, run `sudo npm start` in `server`.

## Config

The configuration file is `server/config.json` and is automatically generated after running the server once.
- `sessionSecret`: Change this to a random string and keep it secret.
- `host`: The host visitors will be visiting in their browser. Necessary for cookie purposes.
- `dbHost`, `dbPort`, `dbName`: To specify the location of the mongodb server.
