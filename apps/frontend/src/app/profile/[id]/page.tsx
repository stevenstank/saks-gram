"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getProfile } from "../../../lib/profile-api";

type ProfileUser = {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
};

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  const userId = useMemo(() => params?.id ?? "", [params]);
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setError("Invalid profile id");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    getProfile(userId)
      .then((data) => {
        setUser(data);
      })
      .catch((fetchError) => {
        const message = fetchError instanceof Error ? fetchError.message : "Failed to load profile";
        setError(message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [userId]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">Loading profile...</p>
        </div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-rose-800">Profile Error</h1>
          <p className="mt-2 text-sm text-rose-700">{error ?? "User not found"}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={`${user.username} avatar`}
              className="h-20 w-20 rounded-full border border-slate-200 object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-xl font-semibold text-slate-500">
              {user.username.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{user.username}</h1>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-slate-50 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Bio</h2>
          <p className="mt-2 text-sm text-slate-700">{user.bio || "No bio added yet."}</p>
        </div>
      </section>
    </main>
  );
}
