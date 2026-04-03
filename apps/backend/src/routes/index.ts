import { Router } from "express";

import authRouter from "./auth.routes";
import commentRouter from "./comment.routes";
import conversationRouter from "./conversation.routes";
import followRouter from "./follow.routes";
import healthRouter from "./health.routes";
import likeRouter from "./like.routes";
import messageRouter from "./message.routes";
import postsRouter from "./posts.routes";
import uploadRouter from "./upload.routes";
import userRouter from "./user.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/comments", commentRouter);
router.use("/conversations", conversationRouter);
router.use("/follow", followRouter);
router.use("/health", healthRouter);
router.use("/likes", likeRouter);
router.use("/messages", messageRouter);
router.use("/posts", postsRouter);
router.use("/upload", uploadRouter);
router.use("/users", userRouter);

export default router;
