import { type NextFunction, type Request, type Response } from "express";

import { AppError } from "../utils/app-error";
import { verifyToken } from "../utils/jwt";

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const cookieToken = typeof req.cookies?.["saksgram.token"] === "string" ? req.cookies["saksgram.token"] : "";

  if (cookieToken) {
    const decoded = verifyToken(cookieToken);
    req.user = decoded;
    next();
    return;
  }

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

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const cookieToken = typeof req.cookies?.["saksgram.token"] === "string" ? req.cookies["saksgram.token"] : "";

  if (cookieToken) {
    try {
      const decoded = verifyToken(cookieToken);
      req.user = decoded;
      next();
      return;
    } catch {
      req.user = undefined;
    }
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
  } catch {
    req.user = undefined;
  }

  next();
}
