"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealth = getHealth;
function getHealth(_req, res) {
    res.status(200).json({
        success: true,
        message: "Server is running",
    });
}
