import { type NextFunction, type Request, type Response } from "express";

import { AppError } from "../utils/app-error";
import { verifyToken } from "../utils/jwt";

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(new AppError("Missing authentication token", 401));
    return;
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    next(new AppError("Missing authentication token", 401));
    return;
  }

  const decoded = verifyToken(token);
  req.user = decoded;
  next();
}
