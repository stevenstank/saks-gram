import multer from "multer";

import { AppError } from "../utils/app-error";

const allowedMimeTypes = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export const uploadPost = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(new AppError("Invalid file type. Only jpg, jpeg, png, and webp are allowed", 400));
      return;
    }

    cb(null, true);
  },
});

export const uploadPostImageFile = uploadPost.single("image");
