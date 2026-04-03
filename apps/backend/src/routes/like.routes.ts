import { Router } from "express";

import { toggleLike } from "../controllers/like.controller";
import { authenticate } from "../middleware/auth.middleware";

const likeRouter = Router();

likeRouter.post("/:postId", authenticate, toggleLike);

export default likeRouter;
