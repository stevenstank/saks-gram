import { Router } from "express";

import { getFeed } from "../controllers/feed.controller";
import { authenticate } from "../middleware/auth.middleware";

const feedRouter = Router();

feedRouter.get("/", authenticate, getFeed);

export default feedRouter;
