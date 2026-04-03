type AppEnv = {
  PORT: number;
  DATABASE_URL: string;
  MONGO_URI: string | null;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  FRONTEND_URL: string | null;
  NODE_ENV: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getOptionalEnv(name: string): string | null {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    return null;
  }

  return value;
}

function getDatabaseUrl(): { databaseUrl: string; mongoUri: string | null } {
  const mongoUri = getOptionalEnv("MONGO_URI");
  const databaseUrl = getOptionalEnv("DATABASE_URL") ?? mongoUri;

  if (!databaseUrl) {
    throw new Error("Missing required environment variable: DATABASE_URL (or MONGO_URI fallback)");
  }

  process.env.DATABASE_URL = databaseUrl;

  return {
    databaseUrl,
    mongoUri,
  };
}

function getPort(): number {
  const rawPort = process.env.PORT?.trim() || "5000";
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT value: ${rawPort}`);
  }

  return port;
}

export function getEnv(): AppEnv {
  const { databaseUrl, mongoUri } = getDatabaseUrl();

  return {
    PORT: getPort(),
    DATABASE_URL: databaseUrl,
    MONGO_URI: mongoUri,
    JWT_SECRET: getRequiredEnv("JWT_SECRET"),
    JWT_EXPIRES_IN: getRequiredEnv("JWT_EXPIRES_IN"),
    FRONTEND_URL: getOptionalEnv("FRONTEND_URL"),
    NODE_ENV: process.env.NODE_ENV ?? "development",
  };
}
