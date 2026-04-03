"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";

import { createPost, uploadPostImage } from "../services/post";
import type { Post } from "../types/post";
import { useToast } from "../hooks/use-toast";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

type CreatePostProps = {
  onCreated?: (post: Post) => void;
};

const MAX_CONTENT_LENGTH = 500;

export function CreatePost({ onCreated }: CreatePostProps) {
  const { showErrorToast, showSuccessToast } = useToast();
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
      const message = "Add text or an image";
      setError(message);
      showErrorToast(message);
      return;
    }

    if (trimmed.length > MAX_CONTENT_LENGTH) {
      const message = "Content must be at most 500 characters";
      setError(message);
      showErrorToast(message);
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
      showSuccessToast("Post created");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Failed to create post";
      setError(message);
      showErrorToast(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-4">
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
          className="w-full rounded-xl border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30"
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
          className="block w-full text-sm text-gray-300 file:mr-3 file:rounded-lg file:border file:border-gray-800 file:bg-gray-900 file:px-3 file:py-2 file:text-sm file:text-white"
        />

        {imagePreviewUrl ? (
          <div className="space-y-4">
            <img src={imagePreviewUrl} alt="Post preview" className="max-h-80 rounded-xl object-cover" />
            <Button type="button" variant="ghost" onClick={() => setImageFile(null)} disabled={isLoading}>
              Remove image
            </Button>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-gray-400">{remainingChars} characters left</p>
          <Button type="submit" loading={isLoading}>
            {isLoading ? "Posting..." : "Post"}
          </Button>
        </div>

        {error ? (
          <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        ) : null}
      </form>
    </Card>
  );
}
