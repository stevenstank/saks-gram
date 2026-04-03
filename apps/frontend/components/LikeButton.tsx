"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { togglePostLike } from "../src/services/post";

type LikeButtonProps = {
  postId: string;
  isLiked: boolean;
  likesCount: number;
};

export function LikeButton({ postId, isLiked, likesCount }: LikeButtonProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(isLiked);
  const [count, setCount] = useState(likesCount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onToggleLike() {
    if (isLoading) {
      return;
    }

    setError(null);

    const previousLiked = liked;
    const previousCount = count;
    const nextLiked = !previousLiked;
    const nextCount = Math.max(0, previousCount + (previousLiked ? -1 : 1));

    setLiked(nextLiked);
    setCount(nextCount);
    setIsLoading(true);

    try {
      const response = await togglePostLike(postId);

      if (response.data.liked !== nextLiked) {
        const reconciledCount = Math.max(0, previousCount + (response.data.liked ? 1 : -1));
        setCount(reconciledCount);
      }

      setLiked(response.data.liked);
    } catch (toggleError) {
      setLiked(previousLiked);
      setCount(previousCount);

      const message = toggleError instanceof Error ? toggleError.message : "Failed to update like";

      if (message === "Missing authentication token") {
        router.push("/login");
        return;
      }

      setError(message);
    } finally {
      window.setTimeout(() => {
        setIsLoading(false);
      }, 250);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={onToggleLike}
        disabled={isLoading}
        aria-pressed={liked}
        aria-label={liked ? "Unlike post" : "Like post"}
        className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span>{liked ? "❤️" : "🤍"}</span>
        <span>{count}</span>
      </button>

      {error ? <p className="mt-1 text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
