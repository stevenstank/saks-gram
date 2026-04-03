"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import { FollowButton } from "../../../components/follow-button";
import { PostCard } from "../../../components/post-card";
import { Button } from "../../../components/ui/button";
import { Avatar } from "../../../components/ui/avatar";
import { useAuth } from "../../../hooks/use-auth";
import { useRequireAuth } from "../../../hooks/use-require-auth";
import { useToast } from "../../../hooks/use-toast";
import { getFollowers, getFollowing, getProfile } from "../../../lib/profile-api";
import { getPostsByUser } from "../../../services/post";
import type { Post } from "../../../types/post";

type ProfileUser = {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
};

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  const username = useMemo(() => params?.id ?? "", [params]);
  const { isCheckingAuth } = useRequireAuth();
  const { user: authUser, isAuthenticated, isBootstrapping } = useAuth();
  const { showErrorToast } = useToast();

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isPostsLoading, setIsPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const isOwnProfile = useMemo(() => {
    if (isBootstrapping || !isAuthenticated || !authUser || !user) {
      return false;
    }

    return authUser.username === user.username;
  }, [authUser, isAuthenticated, isBootstrapping, user]);

  const { data: followers = [] } = useSWR(username ? `followers:${username}` : null, () => getFollowers(username));
  const { data: following = [] } = useSWR(username ? `following:${username}` : null, () => getFollowing(username));

  useEffect(() => {
    if (!username) {
      setError("Invalid profile username");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    getProfile(username)
      .then((data) => {
        setUser(data);
      })
      .catch((fetchError) => {
        const message = fetchError instanceof Error ? fetchError.message : "Failed to load profile";
        setError(message);
        showErrorToast(message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [showErrorToast, username]);

  useEffect(() => {
    if (!username) {
      setPosts([]);
      setPostsError("Invalid profile username");
      setIsPostsLoading(false);
      return;
    }

    setIsPostsLoading(true);
    setPostsError(null);

    getPostsByUser(username)
      .then((data) => {
        setPosts(data);
      })
      .catch((fetchError) => {
        const message = fetchError instanceof Error ? fetchError.message : "Failed to load posts";
        setPostsError(message);
        showErrorToast(message);
      })
      .finally(() => {
        setIsPostsLoading(false);
      });
  }, [showErrorToast, username]);

  if (isCheckingAuth) {
    return (
      <main className="min-h-screen bg-black px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-xl rounded-2xl border border-gray-800 bg-[#111111] p-6 shadow-sm">
          <p className="text-sm text-gray-400">Checking your session...</p>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-xl rounded-2xl border border-gray-800 bg-[#111111] p-6 shadow-sm">
          <p className="text-sm text-gray-400">Loading profile...</p>
        </div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="min-h-screen bg-black px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-xl rounded-2xl border border-red-900/50 bg-red-950/30 p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-red-300">Profile Error</h1>
          <p className="mt-2 text-sm text-red-300">{error ?? "User not found"}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-6 sm:px-6 sm:py-8">
      <section className="mx-auto w-full max-w-3xl space-y-6">
        <div className="rounded-2xl border border-gray-800 bg-[#111111] p-5 shadow-soft sm:p-7">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar src={user.avatar ?? null} alt={`${user.username} avatar`} name={user.username} size="lg" />

              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold text-white">{user.username}</h1>
                <p className="truncate text-sm text-gray-400">{user.email}</p>
              </div>
            </div>

            {isOwnProfile ? (
              <Link href="/profile/edit">
                <Button variant="secondary">Edit Profile</Button>
              </Link>
            ) : null}
          </div>

          <div className="mt-6 rounded-xl bg-[#0f0f0f] p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Bio</h2>
            <p className="mt-2 text-sm text-gray-200">{user.bio || "No bio added yet."}</p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-gray-300">
            <Link href={`/profile/${user.username}/followers`} className="transition hover:text-white hover:underline">
              <span className="font-semibold text-white">{followers.length}</span> Followers
            </Link>
            <Link href={`/profile/${user.username}/following`} className="transition hover:text-white hover:underline">
              <span className="font-semibold text-white">{following.length}</span> Following
            </Link>
            <span>
              <span className="font-semibold text-white">{posts.length}</span> Posts
            </span>
          </div>

          {!isOwnProfile ? <FollowButton targetUserId={user.id} targetUsername={user.username} /> : null}
        </div>

        <div className="border-t border-gray-800 pt-6">
          <h2 className="text-base font-semibold text-white">Posts</h2>

          {isPostsLoading ? <p className="mt-3 text-sm text-gray-400">Loading posts...</p> : null}

          {postsError ? (
            <p className="mt-3 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
              {postsError}
            </p>
          ) : null}

          {!isPostsLoading && !postsError && posts.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400">No posts yet.</p>
          ) : null}

          <div className="mt-4 space-y-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                postId={post.id}
                content={post.content}
                author={post.author}
                createdAt={post.createdAt}
                imageUrl={post.imageUrl}
                isLiked={post.isLiked}
                likesCount={post.likesCount}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
