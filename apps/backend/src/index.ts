import dotenv from "dotenv";

import app from "./app";
import { getEnv } from "./config/env";

dotenv.config();

const { PORT } = getEnv();
const serverUrl = `http://localhost:${PORT}`;

app.listen(PORT, () => {
  console.log(`Backend server is running at ${serverUrl}`);
});
