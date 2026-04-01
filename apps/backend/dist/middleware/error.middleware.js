"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = globalErrorHandler;
const app_error_1 = require("../utils/app-error");
function globalErrorHandler(err, _req, res, _next) {
    if (err instanceof app_error_1.AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            statusCode: err.statusCode,
        });
        return;
    }
    console.error("Unexpected error:", err);
    res.status(500).json({
        success: false,
        message: "Internal server error",
        statusCode: 500,
    });
}
