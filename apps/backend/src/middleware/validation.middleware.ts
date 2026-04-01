import { type NextFunction, type Request, type Response } from "express";
import type { ZodTypeAny } from "zod";

import { AppError } from "../utils/app-error";

export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid request body";
      next(new AppError(firstIssue, 400));
      return;
    }

    req.body = parsed.data;
    next();
  };
}
