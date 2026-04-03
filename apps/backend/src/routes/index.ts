import { Router } from "express";

import authRouter from "./auth.routes";
import followRouter from "./follow.routes";
import healthRouter from "./health.routes";
import postsRouter from "./posts.routes";
import uploadRouter from "./upload.routes";
import userRouter from "./user.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/follow", followRouter);
router.use("/health", healthRouter);
router.use("/posts", postsRouter);
router.use("/upload", uploadRouter);
router.use("/users", userRouter);

export default router;
