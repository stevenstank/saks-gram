import { Router } from "express";

import authRouter from "./auth.routes";
import healthRouter from "./health.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/health", healthRouter);

export default router;
