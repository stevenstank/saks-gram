import "dotenv/config";

import app from "./app";
import { getEnv } from "./config/env";

const { PORT } = getEnv();
const serverUrl = `http://localhost:${PORT}`;

app.listen(PORT, () => {
  console.log(`Backend server is running at ${serverUrl}`);
});
