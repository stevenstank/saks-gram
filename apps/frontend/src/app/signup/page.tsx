"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { InputField } from "../../components/ui/input-field";
import { useAuth } from "../../hooks/use-auth";
import { useToast } from "../../hooks/use-toast";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const { showErrorToast } = useToast();
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
      router.push("/feed");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Signup failed";
      setError(message);
      showErrorToast(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-8 md:px-6">
      <Card className="w-full max-w-md space-y-6 rounded-2xl p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold text-white">Sign Up</h1>
          <p className="text-sm text-gray-400">Create your SaksGram account.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <InputField
            id="signup-username"
            label="Username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />

          <InputField
            id="signup-email"
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <InputField
            id="signup-password"
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
          />

          {error ? (
            <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          <Button type="submit" loading={isSubmitting} className="w-full">
            {isSubmitting ? "Creating..." : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-400">
          Already have an account? <Link className="font-medium text-yellow-400" href="/login">Login</Link>
        </p>
      </Card>
    </main>
  );
}
