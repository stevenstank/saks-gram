"use client";

import { type FormEvent, useMemo, useState } from "react";

import { createPost } from "../services/post";
import type { Post } from "../types/post";

type CreatePostProps = {
  onCreated?: (post: Post) => void;
};

const MAX_CONTENT_LENGTH = 500;

export function CreatePost({ onCreated }: CreatePostProps) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remainingChars = useMemo(() => MAX_CONTENT_LENGTH - content.length, [content.length]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = content.trim();

    if (!trimmed) {
      setError("Content is required");
      return;
    }

    if (trimmed.length > MAX_CONTENT_LENGTH) {
      setError("Content must be at most 500 characters");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const post = await createPost(trimmed);
      setContent("");
      onCreated?.(post);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create post");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <textarea
        value={content}
        onChange={(event) => {
          setContent(event.target.value);
          if (error) {
            setError(null);
          }
        }}
        maxLength={MAX_CONTENT_LENGTH}
        rows={4}
        placeholder="Write a post..."
        disabled={isLoading}
      />

      <p>{remainingChars} characters left</p>

      {isLoading ? <p>Creating post...</p> : null}

      <button type="submit" disabled={isLoading}>
        {isLoading ? "Posting..." : "Post"}
      </button>

      {error ? <p>{error}</p> : null}
    </form>
  );
}
