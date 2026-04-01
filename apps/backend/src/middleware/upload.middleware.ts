import multer from "multer";
import { type NextFunction, type Request, type Response } from "express";

import { AppError } from "../utils/app-error";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new AppError("Only image files are allowed", 400));
      return;
    }

    cb(null, true);
  },
});

export function uploadAvatarFile(req: Request, res: Response, next: NextFunction): void {
  upload.single("avatar")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof AppError) {
      next(error);
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(new AppError("Image file is too large (max 5MB)", 400));
      return;
    }

    next(new AppError("Failed to process upload", 400));
  });
}
