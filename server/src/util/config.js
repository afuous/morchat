"use strict";

let fs = require("fs");

let defaultConfig = {
    sessionSecret: "secret",
    host: "",
    dbHost: "localhost",
    dbPort: 27017,
    dbName: "MorChat",
    fcmServerKey: "",
    webPushPublicKey: "",
    webPushPrivateKey: "",
};

let configPath = require("path").join(__dirname, "../../config.json");

let config;

if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath));
    for (let key in defaultConfig) {
        if (!(key in config)) {
            config[key] = defaultConfig[key];
        }
    }
} else {
    config = defaultConfig;
    console.log("Generated default config.json");
}
fs.writeFileSync(configPath, JSON.stringify(config, null, "\t"));

module.exports = config;
