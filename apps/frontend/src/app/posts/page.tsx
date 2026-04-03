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
    <main>
      <h1>Posts</h1>

      <CreatePost
        onCreated={(post) => {
          setPosts((current) => [post, ...current]);
        }}
      />

      {isLoading ? <p>Loading posts...</p> : null}
      {error ? <p>{error}</p> : null}
      {!isLoading && !error && posts.length === 0 ? <p>No posts yet</p> : null}

      <section>
        {posts.map((post) => (
          <PostCard
            key={post.id}
            content={post.content}
            author={post.author}
            createdAt={post.createdAt}
            imageUrl={post.imageUrl}
          />
        ))}
      </section>
    </main>
  );
}
