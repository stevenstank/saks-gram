"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";

import { createPost, uploadPostImage } from "../services/post";
import type { Post } from "../types/post";

type CreatePostProps = {
  onCreated?: (post: Post) => void;
};

const MAX_CONTENT_LENGTH = 500;

export function CreatePost({ onCreated }: CreatePostProps) {
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remainingChars = useMemo(() => MAX_CONTENT_LENGTH - content.length, [content.length]);

  useEffect(() => {
    if (!imageFile) {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
        setImagePreviewUrl(null);
      }
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = content.trim();

    if (!trimmed && !imageFile) {
      setError("Add text or an image");
      return;
    }

    if (trimmed.length > MAX_CONTENT_LENGTH) {
      setError("Content must be at most 500 characters");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      let imageUrl: string | undefined;

      if (imageFile) {
        imageUrl = await uploadPostImage(imageFile);
      }

      const post = await createPost({
        content: trimmed,
        imageUrl,
      });

      setContent("");
      setImageFile(null);
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

      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={(event) => {
          setImageFile(event.target.files?.[0] ?? null);
          if (error) {
            setError(null);
          }
        }}
        disabled={isLoading}
      />

      {imagePreviewUrl ? (
        <div>
          <img src={imagePreviewUrl} alt="Post preview" style={{ maxHeight: "320px", borderRadius: "8px" }} />
          <button type="button" onClick={() => setImageFile(null)} disabled={isLoading}>
            Remove image
          </button>
        </div>
      ) : null}

      <p>{remainingChars} characters left</p>

      {isLoading ? <p>Creating post...</p> : null}

      <button type="submit" disabled={isLoading}>
        {isLoading ? "Posting..." : "Post"}
      </button>

      {error ? <p>{error}</p> : null}
    </form>
  );
}
