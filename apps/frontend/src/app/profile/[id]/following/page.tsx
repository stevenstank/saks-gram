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
      className="flex items-center gap-4 rounded-xl border border-gray-800 bg-[#111111] p-4 transition hover:bg-gray-800"
    >
      {user.avatar ? (
        <img src={user.avatar} alt={`${user.username} avatar`} className="h-12 w-12 rounded-full object-cover" />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800 font-semibold text-white">
          {user.username.slice(0, 1).toUpperCase()}
        </div>
      )}
      <span className="font-semibold text-white hover:underline">{user.username}</span>
    </Link>
  );
}

export default function FollowingPage() {
  const params = useParams<{ id: string }>();
  const username = useMemo(() => params?.id ?? "", [params]);

  const { data, error, isLoading } = useSWR(username ? `following:${username}` : null, () => getFollowing(username));

  return (
    <main className="min-h-screen bg-black px-4 py-6 sm:px-6 sm:py-8">
      <section className="mx-auto w-full max-w-2xl space-y-6">
        <div className="rounded-2xl border border-gray-800 bg-[#111111] p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-white">Following</h1>
          <p className="mt-1 text-sm text-gray-400">People this user follows.</p>
        </div>

        {isLoading ? <p className="text-sm text-gray-400">Loading following...</p> : null}

        {error ? (
          <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
            {error instanceof Error ? error.message : "Failed"}
          </p>
        ) : null}

        {!isLoading && !error && data && data.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-[#111111] p-6 text-sm text-gray-400">Not following anyone yet.</div>
        ) : null}

        <div className="space-y-4">
          {data?.map((followingUser) => (
            <UserRow key={followingUser.id} user={followingUser} />
          ))}
        </div>
      </section>
    </main>
  );
}
