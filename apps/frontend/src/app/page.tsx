import { getHealth } from "../lib/api";

export default async function HomePage() {
  try {
    const health = await getHealth();

    return (
      <main>
        <h1>Frontend Connected</h1>
        <p>success: {String(health.success)}</p>
        <p>message: {health.message}</p>
      </main>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return (
      <main>
        <h1>Frontend Connection Error</h1>
        <p>{message}</p>
      </main>
    );
  }
}
