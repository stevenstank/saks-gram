import jwt from "jsonwebtoken";

import { getEnv } from "../config/env";
import type { JwtPayload } from "../types/auth";
import { AppError } from "./app-error";

export function generateToken(payload: JwtPayload): string {
  const { JWT_SECRET, JWT_EXPIRES_IN } = getEnv();
  const expiresIn: jwt.SignOptions["expiresIn"] = JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"];

  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string): JwtPayload {
  const { JWT_SECRET } = getEnv();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded === "string") {
      throw new AppError("Invalid token payload", 401);
    }

    return decoded as JwtPayload;
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }
}
