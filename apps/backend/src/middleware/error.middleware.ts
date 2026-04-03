import { type NextFunction, type Request, type Response } from "express";
import { Prisma } from "@prisma/client";
import multer from "multer";

import { AppError } from "../utils/app-error";

export function globalErrorHandler(
  err: unknown,
  req: Request,
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

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        success: false,
        message: "Duplicate record",
        statusCode: 409,
      });
      return;
    }

    if (err.code === "P2003") {
      res.status(400).json({
        success: false,
        message: "Invalid relation reference",
        statusCode: 400,
      });
      return;
    }

    if (err.code === "P2025") {
      res.status(404).json({
        success: false,
        message: "Resource not found",
        statusCode: 404,
      });
      return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      message: "Invalid database query input",
      statusCode: 400,
    });
    return;
  }

  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({
      success: false,
      message: "Image file is too large (max 5MB)",
      statusCode: 400,
    });
    return;
  }

  console.error("Unexpected error", {
    method: req.method,
    route: req.originalUrl,
    error: err,
  });

  res.status(500).json({
    success: false,
    message: "Internal server error",
    statusCode: 500,
  });
}
