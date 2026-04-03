import "dotenv/config";

import app from "./app";
import { prisma } from "./config/prisma";

const PORT = process.env.PORT || 5000;

async function startServer(): Promise<void> {
  console.log("Starting server...");

  try {
    await prisma.$connect();
    console.log("Database connection successful");
  } catch (dbError) {
    console.error("Database connection failed", dbError);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((startupError) => {
  console.error("Server startup failed", startupError);
});
