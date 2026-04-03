import { Router } from "express";

import { createPost, getAllPosts, getPostsByUsername } from "../controllers/post.controller";
import { authenticate, optionalAuthenticate } from "../middleware/auth.middleware";

const postsRouter = Router();

postsRouter.get("/", optionalAuthenticate, getAllPosts);
postsRouter.get("/user/:username", optionalAuthenticate, getPostsByUsername);
postsRouter.post("/", authenticate, createPost);

export default postsRouter;
