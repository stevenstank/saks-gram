import { type NextFunction, type Request, type Response } from "express";

import { AppError } from "../utils/app-error";
import { uploadImage } from "../utils/upload-image";

export async function uploadPostImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      throw new AppError("Image file is required", 400);
    }

    const imageUrl = await uploadImage(req.file.buffer, {
      folder: "saksgram/posts",
    });

    res.status(200).json({
      imageUrl,
    });
  } catch (error) {
    next(error);
  }
}
