import { Router } from "express";

import { createPost, getAllPosts, getPostsByUsername } from "../controllers/post.controller";
import { authenticate } from "../middleware/auth.middleware";

const postsRouter = Router();

postsRouter.get("/", getAllPosts);
postsRouter.get("/user/:username", getPostsByUsername);
postsRouter.post("/", authenticate, createPost);

export default postsRouter;
