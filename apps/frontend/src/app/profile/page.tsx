"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Avatar } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { useAuth } from "../../hooks/use-auth";
import { useRequireAuth } from "../../hooks/use-require-auth";
import { useToast } from "../../hooks/use-toast";
import { getCurrentUser, getFollowers, getFollowing } from "../../lib/profile-api";
import { getPostsByUser } from "../../services/post";
import type { Post } from "../../types/post";

type ProfileUser = {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
};

export default function MyProfilePage() {
  const { isCheckingAuth } = useRequireAuth();
  const { isBootstrapping } = useAuth();
  const { showErrorToast } = useToast();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }

    setIsLoading(true);
    setError(null);

    getCurrentUser()
      .then(async (data) => {
        setUser(data);

        const [followers, following, userPosts] = await Promise.all([
          getFollowers(data.username),
          getFollowing(data.username),
          getPostsByUser(data.username),
        ]);

        setFollowersCount(followers.length);
        setFollowingCount(following.length);
        setPosts(userPosts);
      })
      .catch((fetchError) => {
        const message = fetchError instanceof Error ? fetchError.message : "Failed to load profile";
        setError(message);
        showErrorToast(message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isBootstrapping, showErrorToast]);

  if (isCheckingAuth) {
    return (
      <main className="w-full py-8">
        <div className="mx-auto w-full max-w-[760px]">
        <Card>
          <p className="text-sm text-gray-400">Checking your session...</p>
        </Card>
        </div>
      </main>
    );
  }

  if (isLoading || isBootstrapping) {
    return (
      <main className="w-full py-8">
        <div className="mx-auto w-full max-w-[760px]">
          <Card>
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="h-20 w-20 rounded-full" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-52" />
            </div>
          </Card>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="w-full py-8">
        <div className="mx-auto w-full max-w-[760px]">
          <Card>
            <h1 className="text-lg font-semibold text-red-300">Profile Error</h1>
            <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
              {error ?? "Unable to load profile"}
            </p>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full py-8">
      <div className="mx-auto w-full max-w-[760px] space-y-6">
        <Card className="items-center text-center">
        <div className="flex flex-col items-center gap-4">
          <Avatar src={user.avatar ?? null} alt={`${user.username} avatar`} name={user.username} size="lg" />
          <div>
            <h1 className="text-2xl font-semibold text-white">{user.username}</h1>
            <p className="text-sm text-gray-400">{user.email}</p>
          </div>

          <p className="max-w-xl text-sm text-gray-300">{user.bio || "No bio added yet."}</p>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-300">
            <div>
              <span className="block text-lg font-semibold text-white">{followersCount}</span>
              <span>Followers</span>
            </div>
            <div>
              <span className="block text-lg font-semibold text-white">{followingCount}</span>
              <span>Following</span>
            </div>
            <div>
              <span className="block text-lg font-semibold text-white">{posts.length}</span>
              <span>Posts</span>
            </div>
          </div>

          <Link href="/profile/edit">
            <Button variant="secondary">Edit Profile</Button>
          </Link>
        </div>
        </Card>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Posts</h2>
          {posts.length === 0 ? (
            <Card>
              <p className="text-sm text-gray-400">No posts yet.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {posts.map((post) => (
                <Card key={post.id} className="space-y-2">
                  {post.imageUrl ? (
                    <img src={post.imageUrl} alt="Post" className="h-48 w-full rounded-xl object-cover" />
                  ) : null}
                  <p className="line-clamp-4 text-sm text-gray-200">{post.content}</p>
                  <p className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleString()}</p>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
