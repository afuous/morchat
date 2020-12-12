"use strict";

// let config = require("./config");
let config = {
    dbHost: "localhost",
    dbPort: 5432,
    dbUsername: "morchat",
    dbPassword: "morchat",
    dbName: "morchat",
};

let pool = new (require("pg").Pool)({
    host: config.dbHost,
    port: config.dbPort,
    user: config.dbUsername,
    password: config.dbPassword,
    database: config.dbName,
});

let db = {};

function unjoin(name, obj) {
    let result = {};
    result[name] = {};
    let prefix = name + "_";
    for (let key of Object.keys(obj)) {
        if (key.startsWith(prefix)) {
            result[name][key.slice(prefix.length)] = obj[key];
        } else {
            result[key] = obj[key];
        }
    }
    return result;
}

function deUnderscore(row) {
    if (!row) {
        return null;
    }
    let result = {};
    for (let key of Object.keys(row)) {
        let newKey = key.replace(/_[a-z]/g, str => str[1].toUpperCase());
        result[newKey] = row[key];
    }
    return result;
}

db.aliasUserJoin = function(name, userAlias) {
    userAlias = userAlias || "users";
    let cols = [
        // needs to be a list of all columns in users table
        "id",
        "username",
        "firstname",
        "lastname",
        "email",
        "phone",
        "created_at",
        "prof_pic_url",
    ];
    let str = cols.map(col => (
        "users." + col + " AS " + name + "_" + col
    )).join(", ");
    return " " + str + " ";
}

db.pool = pool;

db.queryAll = async function(template, values, client) {
    if (!Array.isArray(values)) {
        client = values;
        values = [];
    }
    client = client || pool;

    let result = await client.query(template, values);
    return result.rows.map(row => deUnderscore(row));
};

db.queryOne = async function(template, values, client) {
    if (!Array.isArray(values)) {
        client = values;
        values = [];
    }
    client = client || pool;

    let result = await client.query(template, values);
    let row = result.rows[0];
    if (!row) {
        return null;
    }
    row = deUnderscore(row);
    return row;
};

db.queryAllCollectUser = async function(name, template, values, client) {
    if (!Array.isArray(values)) {
        client = values;
        values = [];
    }
    client = client || pool;

    let result = await client.query(template, values);
    return result.rows.map(row => {
        row = unjoin(name, row);
        row[name] = deUnderscore(row[name]);
        row = deUnderscore(row);
        return row;
    });
};

db.queryOneCollectUser = async function(name, template, values, client) {
    if (!Array.isArray(values)) {
        client = values;
        values = [];
    }
    client = client || pool;

    let result = await client.query(template, values);
    let row = results.rows[0];
    if (!row) {
        return null;
    }
    row = unjoin(name, row);
    row[name] = deUnderscore(row[name]);
    row = deUnderscore(row);
    return row;
};

db.transaction = async function(func) {
    let ret;
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        ret = await func(client);
        await client.query("COMMIT");
    } catch (e) {
        await client.query("ROLLBACK");
        throw e;
    } finally {
        client.release();
    }
    return ret;
};

// do not put too many non-sql side effects in the function passed into this
// because it can be called multiple times
db.transactionSerializable = async function(func) {
    let ret;
    while (true) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE");
            ret = await func(client);
            await client.query("COMMIT");
            break;
        } catch (e) {
            if (typeof(e) == "object" && e !== null && e.code == "40001") { // serialization failure
                // TODO: log this, i am curious how much it actually happens
                continue;
            }
            throw e;
        } finally {
            client.release();
        }
    }
    return ret;
}


module.exports = db;
