import { Router } from "express";

import authRouter from "./auth.routes";
import healthRouter from "./health.routes";
import userRouter from "./user.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/health", healthRouter);
router.use("/users", userRouter);

export default router;
