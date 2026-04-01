import { Router } from "express";

import { login, me, register } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validation.middleware";
import { loginSchema, registerSchema } from "../validation/auth.validation";

const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), register);
authRouter.post("/login", validateBody(loginSchema), login);
authRouter.get("/me", authenticate, me);

export default authRouter;
