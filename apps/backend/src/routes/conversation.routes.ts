import { Router } from "express";

import { getMyConversations, startConversation } from "../controllers/conversation.controller";
import { authenticate } from "../middleware/auth.middleware";

const conversationRouter = Router();

conversationRouter.get("/", authenticate, getMyConversations);
conversationRouter.post("/", authenticate, startConversation);
conversationRouter.post("/start/:userId", authenticate, startConversation);

export default conversationRouter;
