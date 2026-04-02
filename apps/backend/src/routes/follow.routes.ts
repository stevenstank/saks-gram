import { Router } from "express";

import { followUser, getFollowStatus, unfollowUser } from "../controllers/follow.controller";
import { authenticate } from "../middleware/auth.middleware";

const followRouter = Router();

followRouter.get("/status/:userId", authenticate, getFollowStatus);
followRouter.post("/:userId", authenticate, followUser);
followRouter.delete("/:userId", authenticate, unfollowUser);

export default followRouter;
