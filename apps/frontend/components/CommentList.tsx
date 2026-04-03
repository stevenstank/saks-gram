"use client";

import { useEffect, useState } from "react";

import API_URL from "../src/lib/api-config";
import { CommentItem, type Comment } from "./CommentItem";

type CommentListProps = {
  postId: string;
  refreshKey?: number;
};

type GetCommentsResponse = {
  success: boolean;
  data: {
    comments: Comment[];
  };
};

function isGetCommentsResponse(value: unknown): value is GetCommentsResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("data" in value)) {
    return false;
  }

  const data = (value as { data?: unknown }).data;
  return typeof data === "object" && data !== null && "comments" in data;
}

export function CommentList({ postId, refreshKey = 0 }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadComments() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_URL}/api/comments/${encodeURIComponent(postId)}`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        const body = (await response.json()) as GetCommentsResponse | { message?: string };

        if (!response.ok) {
          const message =
            typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
              ? body.message
              : "Failed to load comments";
          throw new Error(message);
        }

        if (!isMounted) {
          return;
        }

        if (!isGetCommentsResponse(body)) {
          throw new Error("Invalid comments response");
        }

        const newestFirst = [...body.data.comments].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        setComments(newestFirst);
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Failed to load comments");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadComments();

    return () => {
      isMounted = false;
    };
  }, [postId, refreshKey]);

  if (isLoading) {
    return <p className="text-sm text-gray-400">Loading comments...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-300">{error}</p>;
  }

  if (comments.length === 0) {
    return <p className="text-sm text-gray-400">No comments yet.</p>;
  }

  return (
    <div className="space-y-2">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
}
