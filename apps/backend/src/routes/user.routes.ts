import { Router } from "express";

import { getFollowersByUserId, getFollowingByUserId } from "../controllers/follow.controller";
import { getCurrentUser, getUserById, getUsers, updateUser, uploadAvatar } from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
import { uploadAvatarFile } from "../middleware/upload.middleware";
import { validateBody } from "../middleware/validation.middleware";
import { updateUserSchema } from "../validation/user.validation";

const userRouter = Router();

userRouter.get("/me", authenticate, getCurrentUser);
userRouter.get("/", authenticate, getUsers);
userRouter.get("/:userId/followers", getFollowersByUserId);
userRouter.get("/:userId/following", getFollowingByUserId);
userRouter.get("/:id", getUserById);
userRouter.put("/update", authenticate, validateBody(updateUserSchema), updateUser);
userRouter.post("/upload-avatar", authenticate, uploadAvatarFile, uploadAvatar);

export default userRouter;
