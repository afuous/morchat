# MorChat

A chat application. Anybody can run an instance.

MorChat is a derivative of [MorTeam](https://github.com/mortorqrobotics/morteam-server), but with many of the team organization features removed, instead focusing on chat.

## How to run

1. Install node.js, npm, and PostgreSQL.
2. Run `npm install` in `server` and `web`.
3. Run `npm run build` in `web`.
4. Ensure that a PostgreSQL server is running, and run the migration script `server/initpg.sh`.
5. To start the server, run `sudo npm start` in `server`.

## Config

The server configuration file is `server/config.json` and is automatically generated after running the server once.
- `sessionSecret`: Change this to a random string and keep it secret.
- `host`: The host visitors will be visiting in their browser, for cookie purposes. Probably best to keep this empty.
- `dbHost`, `dbPort`, `dbName`, `dbUsername`, `dbPassword`: To specify access to the database. The `server/initpg.sh` script will not work verbatim if these are changed.
- `fcmServerKey`: See push notifications below. Keeping this empty is fine but there will be no push notifications.

The web client configuration file is `web/src/config.json` and is automatically generated after running npm install in `web`.
- `imgurClientId`: Change this to your Imgur API client id if you want to integrate Imgur uploads to the chat.

## Mobile

In `mobile/web`, run `build.sh` to produce a standalone html file `build.html` containing the mobile website. For testing, use `test.html` without any building necessary.

## Push notifications

To get push notifications working, first create a project in Firebase. Download `google-services.json` from [here](https://console.firebase.google.com/project/_/settings/general/) and move the file to `mobile/app/android/app/google-services.json`. Download a service account key from [here](https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk) (click "Generate new private key") and move the file to `server/googleServiceAccountKey.json`.
