"use client";

import Link from "next/link";

import { useAuth } from "../hooks/use-auth";
import { Button } from "./ui/button";

export function AuthStatus() {
  const { user, isAuthenticated, isBootstrapping, logout } = useAuth();

  if (isBootstrapping) {
    return <p className="text-gray-400">Checking session...</p>;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="stack-sm">
        <p className="text-gray-400">You are not logged in.</p>
        <div className="row">
          <Link href="/login" className="button secondary">
            Login
          </Link>
          <Link href="/signup" className="button">
            Sign up
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="stack-sm">
      <p className="text-gray-300">
        Signed in as{" "}
        <Link href={`/profile/${encodeURIComponent(user.username)}`} className="font-semibold text-white hover:underline">
          {user.username}
        </Link>{" "}
        ({user.email})
      </p>
      <Button type="button" variant="danger" onClick={logout}>
        Logout
      </Button>
    </div>
  );
}
