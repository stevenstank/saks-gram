"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import useSWR from "swr";

import { getFollowing, type BasicFollowUser } from "../../../../lib/profile-api";

function UserRow({ user }: { user: BasicFollowUser }) {
  return (
    <Link
      href={`/profile/${user.username}`}
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:bg-slate-50"
    >
      {user.avatar ? (
        <img src={user.avatar} alt={`${user.username} avatar`} className="h-12 w-12 rounded-full object-cover" />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-600">
          {user.username.slice(0, 1).toUpperCase()}
        </div>
      )}
      <span className="font-medium text-slate-800">{user.username}</span>
    </Link>
  );
}

export default function FollowingPage() {
  const params = useParams<{ id: string }>();
  const username = useMemo(() => params?.id ?? "", [params]);

  const { data, error, isLoading } = useSWR(username ? `following:${username}` : null, () => getFollowing(username));

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-2xl space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Following</h1>
          <p className="mt-1 text-sm text-slate-500">People this user follows.</p>
        </div>

        {isLoading ? <p className="text-sm text-slate-600">Loading following...</p> : null}

        {error ? <p className="text-sm text-rose-700">{error instanceof Error ? error.message : "Failed"}</p> : null}

        {!isLoading && !error && data && data.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Not following anyone yet.</div>
        ) : null}

        <div className="space-y-3">
          {data?.map((followingUser) => (
            <UserRow key={followingUser.id} user={followingUser} />
          ))}
        </div>
      </section>
    </main>
  );
}
