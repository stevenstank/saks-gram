import { Router } from "express";

import { createComment, getCommentsByPost } from "../controllers/comment.controller";
import { createPost, getAllPosts, getPostsByUsername } from "../controllers/post.controller";
import { likePost, unlikePost } from "../controllers/like.controller";
import { authenticate, optionalAuthenticate } from "../middleware/auth.middleware";

const postsRouter = Router();

postsRouter.get("/", optionalAuthenticate, getAllPosts);
postsRouter.get("/user/:username", optionalAuthenticate, getPostsByUsername);
postsRouter.post("/", authenticate, createPost);
postsRouter.get("/:id/comments", getCommentsByPost);
postsRouter.post("/:id/comments", authenticate, createComment);
postsRouter.post("/:id/like", authenticate, likePost);
postsRouter.delete("/:id/like", authenticate, unlikePost);

export default postsRouter;
