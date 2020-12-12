"use strict";

let middlechecker = {};

middlechecker.checkBody = (pattern) => (req, res, next) => {
    if (!pattern) {
        return next();
    }
    let input = req.method === "GET" || req.method === "DELETE"
        ? req.query
        : req.body;
    if (typecheck(pattern, input)) {
        next();
    } else {
        handleTypeError(req, res);
    }
};

let types = middlechecker.types = {
    integer: (obj) => {
        return typeof obj === "number" && obj % 1 === 0;
    },
    float: (obj) => {
        return typeof obj === "number";
    },
    string: (obj) => {
        return typeof obj === "string";
    },
    boolean: (obj) => {
        return typeof obj === "boolean";
    },
    any: (obj) => {
        return true;
    },
    maybe: (model) => (obj) => {
        return typeof obj === "undefined" || typecheck(model, obj);
    },
    value: (value) => (obj) => {
        return obj === value;
    },
    enum: (options) => (obj) => {
        return options.indexOf(obj) !== -1;
    },
    union: (models) => (obj) => {
        return models.some(model => typecheck(model, obj));
    },
};
types.id = types.integer;

module.exports = middlechecker;


function handleTypeError(req, res) {
    res.status(400).end("Invalid request");
}

function typecheck(model, obj) {
    if (typeof model === "object") {
        if (Array.isArray(model)) {
            return Array.isArray(obj) && obj.every(x => typecheck(model[0], x));
        } else {
            return typeof obj === "object"
                && Object.keys(model).every(key => typecheck(model[key], obj[key]));
        }
    } else {
        return model(obj);
    }
}
