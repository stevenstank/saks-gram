import "dotenv/config";

import app from "./app";
import { getEnv } from "./config/env";

const { PORT } = getEnv();

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
