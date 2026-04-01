"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
dotenv_1.default.config();
const { PORT } = (0, env_1.getEnv)();
const serverUrl = `http://localhost:${PORT}`;
app_1.default.listen(PORT, () => {
    console.log(`Backend server is running at ${serverUrl}`);
});
