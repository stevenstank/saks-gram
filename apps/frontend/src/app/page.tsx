import { AuthStatus } from "../components/auth-status";
import { getHealth } from "../lib/api";

export default async function HomePage() {
  try {
    const health = await getHealth();

    return (
      <main className="page">
        <section className="card stack">
          <h1>SaksGram</h1>
          <p className="muted">success: {String(health.success)}</p>
          <p className="muted">message: {health.message}</p>
          <AuthStatus />
        </section>
      </main>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return (
      <main className="page">
        <section className="card stack">
          <h1>Frontend Connection Error</h1>
          <p className="error">{message}</p>
        </section>
      </main>
    );
  }
}
