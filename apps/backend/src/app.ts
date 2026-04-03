import cors from "cors";
import cookieParser from "cookie-parser";
import express, { type Request, type Response, type NextFunction } from "express";

import { globalErrorHandler } from "./middleware/error.middleware";
import feedRouter from "./routes/feed.routes";
import apiRouter from "./routes";
import { AppError } from "./utils/app-error";

const app = express();
const frontendUrl = process.env.FRONTEND_URL?.trim() || null;
const defaultFrontendUrl = "https://saks-gram-frontend.vercel.app";

const normalizeOrigin = (value: string) => value.replace(/\/+$/, "");

const allowedOrigins = [frontendUrl, defaultFrontendUrl]
  .filter((value): value is string => Boolean(value))
  .map((value) => normalizeOrigin(value));

app.set("trust proxy", 1);

if (!frontendUrl) {
  console.warn(`FRONTEND_URL is not set. Falling back to ${defaultFrontendUrl} for CORS.`);
}

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (e.g. curl/Postman) with no Origin header.
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = normalizeOrigin(origin);
      if (allowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.status(200).send("API is running");
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).send("OK");
});

app.use("/feed", feedRouter);
app.use("/api", apiRouter);

app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError("Route not found", 404));
});

app.use(globalErrorHandler);

export default app;
