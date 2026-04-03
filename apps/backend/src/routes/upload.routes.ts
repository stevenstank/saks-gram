import { Router } from "express";

import { uploadPostImage } from "../controllers/upload.controller";
import { authenticate } from "../middleware/auth.middleware";
import { uploadPostImageFile } from "../middleware/uploadPost";

const uploadRouter = Router();

uploadRouter.post("/post", authenticate, uploadPostImageFile, uploadPostImage);

export default uploadRouter;
