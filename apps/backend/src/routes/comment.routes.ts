import { Router } from "express";

import { createComment, deleteComment, getCommentsByPost } from "../controllers/comment.controller";
import { authenticate } from "../middleware/auth.middleware";

const commentRouter = Router();

commentRouter.post("/", authenticate, createComment);
commentRouter.get("/:postId", getCommentsByPost);
commentRouter.delete("/:id", authenticate, deleteComment);

export default commentRouter;
