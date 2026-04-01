"use client";

import Link from "next/link";

import { useAuth } from "../hooks/use-auth";

export function AuthStatus() {
  const { user, isAuthenticated, isBootstrapping, logout } = useAuth();

  if (isBootstrapping) {
    return <p className="muted">Checking session...</p>;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="stack-sm">
        <p className="muted">You are not logged in.</p>
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
      <p>Signed in as <strong>{user.username}</strong> ({user.email})</p>
      <button type="button" className="button danger" onClick={logout}>
        Logout
      </button>
    </div>
  );
}
