"use client";

import { useEffect, useState } from "react";

import { CreatePost } from "../../components/create-post";
import { PostCard } from "../../components/post-card";
import { getAllPosts } from "../../services/post";
import type { Post } from "../../types/post";

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    getAllPosts()
      .then((items) => {
        setPosts(items);
      })
      .catch((fetchError) => {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load posts");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <main className="mx-auto w-full max-w-[760px] space-y-6 px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-semibold text-white">Posts</h1>

      <CreatePost
        onCreated={(post) => {
          setPosts((current) => [post, ...current]);
        }}
      />

      {isLoading ? <p className="text-sm text-gray-400">Loading posts...</p> : null}
      {error ? (
        <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}
      {!isLoading && !error && posts.length === 0 ? <p className="text-sm text-gray-400">No posts yet</p> : null}

      <section className="space-y-6">
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
      </section>
    </main>
  );
}
