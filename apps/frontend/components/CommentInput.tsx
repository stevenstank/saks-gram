"use client";

import { useState, type FormEvent } from "react";

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
    <form onSubmit={onSubmit} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor={`comment-${postId}`}>
        Add a comment
      </label>

      <input
        id={`comment-${postId}`}
        type="text"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Write a comment..."
        maxLength={300}
        disabled={isLoading}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-200 transition focus:ring"
      />

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-slate-500">{300 - content.length} characters left</span>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Posting..." : "Comment"}
        </button>
      </div>

      {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
    </form>
  );
}
