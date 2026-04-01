"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnv = getEnv;
function getRequiredEnv(name) {
    const value = process.env[name];
    if (!value || value.trim() === "") {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
function getPort() {
    const rawPort = getRequiredEnv("PORT");
    const port = Number(rawPort);
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
        throw new Error(`Invalid PORT value: ${rawPort}`);
    }
    return port;
}
function getEnv() {
    return {
        PORT: getPort(),
        DATABASE_URL: getRequiredEnv("DATABASE_URL"),
    };
}
