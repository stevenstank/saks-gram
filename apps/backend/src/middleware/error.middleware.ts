import { type NextFunction, type Request, type Response } from "express";

import { AppError } from "../utils/app-error";

export function globalErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
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
