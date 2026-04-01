type AppEnv = {
  PORT: number;
  DATABASE_URL: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getPort(): number {
  const rawPort = getRequiredEnv("PORT");
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT value: ${rawPort}`);
  }

  return port;
}

export function getEnv(): AppEnv {
  return {
    PORT: getPort(),
    DATABASE_URL: getRequiredEnv("DATABASE_URL"),
  };
}
