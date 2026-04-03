"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

import { Avatar } from "../../../components/ui/avatar";
import { Card } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";
import { getPostById } from "../../../services/post";
import type { Post } from "../../../types/post";

type PostDetailPageProps = {
  params: Promise<{
    postId: string;
  }>;
};

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const { postId } = use(params);
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    getPostById(postId)
      .then((item) => {
        if (!item) {
          setError("Post not found");
          return;
        }

        setPost(item);
      })
      .catch((fetchError) => {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load post");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [postId]);

  if (isLoading) {
    return (
      <main className="w-full py-8">
        <div className="mx-auto w-full max-w-2xl space-y-3">
          <Skeleton className="h-5 w-36" />
          <Card className="space-y-3">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-5 w-3/4" />
          </Card>
        </div>
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="w-full py-8">
        <div className="mx-auto w-full max-w-2xl space-y-3">
          <Link href="/posts" className="inline-flex text-sm text-gray-400 transition hover:text-white">
            Back to posts
          </Link>
          <Card>
            <h1 className="text-lg font-semibold text-red-300">Post Error</h1>
            <p className="mt-2 text-sm text-red-300">{error ?? "Post not found"}</p>
          </Card>
        </div>
      </main>
    );
  }

  const username = post.author?.username ?? "Unknown";
  const avatar = post.author?.avatar ?? null;

  return (
    <main className="w-full py-8">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <Link href="/posts" className="inline-flex text-sm text-gray-400 transition hover:text-white">
          Back to posts
        </Link>

        <Card className="space-y-4">
          <header className="flex items-center gap-3">
            <Avatar src={avatar} alt={`${username} avatar`} name={username} size="md" />
            <div>
              <p className="text-sm font-semibold text-white">{username}</p>
              <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</p>
            </div>
          </header>

          {post.imageUrl ? <img src={post.imageUrl} alt="Post" className="w-full rounded-2xl object-cover" /> : null}

          <p className="whitespace-pre-wrap text-sm text-gray-100">{post.content}</p>
        </Card>
      </div>
    </main>
  );
}
