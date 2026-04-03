import { Router } from "express";

import { deleteMessage, getConversationMessages, sendMessage } from "../controllers/message.controller";
import { authenticate } from "../middleware/auth.middleware";

const messageRouter = Router();

messageRouter.get("/conversation/:conversationId", authenticate, getConversationMessages);
messageRouter.post("/", authenticate, sendMessage);
messageRouter.delete("/:id", authenticate, deleteMessage);

export default messageRouter;
