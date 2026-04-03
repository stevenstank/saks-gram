"use client";

import { useState, type FormEvent } from "react";

import { Button } from "../src/components/ui/button";
import { InputField } from "../src/components/ui/input-field";

type CommentInputProps = {
  postId: string;
  onCreated?: () => void;
};

type CreateCommentResponse = {
  success: boolean;
  data: {
    comment: {
      id: string;
    };
  };
};

function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl || baseUrl.trim() === "") {
    throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
  }

  return baseUrl.replace(/\/$/, "");
}

function getTokenFromStorage(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("saksgram.auth.token");
}

export function CommentInput({ postId, onCreated }: CommentInputProps) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = content.trim();

    if (!trimmed) {
      setError("Comment cannot be empty");
      return;
    }

    if (trimmed.length > 300) {
      setError("Comment must be at most 300 characters");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = getTokenFromStorage();

      const response = await fetch(`${getApiBaseUrl()}/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          content: trimmed,
          postId,
        }),
      });

      const body = (await response.json()) as CreateCommentResponse | { message?: string };

      if (!response.ok) {
        const message =
          typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
            ? body.message
            : "Failed to create comment";
        throw new Error(message);
      }

      setContent("");
      onCreated?.();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create comment");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-gray-800 bg-[#111111] p-3 shadow-sm">
      <label className="mb-2 block text-sm font-medium text-white" htmlFor={`comment-${postId}`}>
        Add a comment
      </label>

      <InputField
        id={`comment-${postId}`}
        label=""
        type="text"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Write a comment..."
        maxLength={300}
        disabled={isLoading}
        className="w-full"
      />

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">{300 - content.length} characters left</span>
        <Button type="submit" loading={isLoading}>
          {isLoading ? "Posting..." : "Comment"}
        </Button>
      </div>

      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
    </form>
  );
}
