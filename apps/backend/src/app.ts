import cors from "cors";
import express, { type Request, type Response, type NextFunction } from "express";

import { globalErrorHandler } from "./middleware/error.middleware";
import apiRouter from "./routes";
import { AppError } from "./utils/app-error";

const app = express();

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use(cors());
app.use(express.json());

app.use("/api", apiRouter);

app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError("Route not found", 404));
});

app.use(globalErrorHandler);

export default app;
