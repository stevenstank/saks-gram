"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useAuth } from "../../hooks/use-auth";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signup({ username, email, password });
      router.push("/");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Signup failed";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page">
      <section className="card stack">
        <h1>Create Account</h1>
        <p className="muted">Join SaksGram in a minute.</p>

        <form onSubmit={onSubmit} className="stack">
          <label className="stack-xs">
            <span>Username</span>
            <input
              className="input"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label className="stack-xs">
            <span>Email</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="stack-xs">
            <span>Password</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </label>

          {error ? <p className="error">{error}</p> : null}

          <button className="button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="muted">
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}
