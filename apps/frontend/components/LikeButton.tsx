"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { togglePostLike } from "../src/services/post";
import { Button } from "../src/components/ui/button";

type LikeButtonProps = {
  postId: string;
  isLiked: boolean;
  likesCount: number;
};

export function LikeButton({ postId, isLiked, likesCount }: LikeButtonProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(isLiked);
  const [isPopping, setIsPopping] = useState(false);
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
    setIsPopping(true);
    window.setTimeout(() => setIsPopping(false), 220);
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
      <Button
        type="button"
        onClick={onToggleLike}
        disabled={isLoading}
        variant={liked ? "danger" : "secondary"}
        aria-pressed={liked}
        aria-label={liked ? "Unlike post" : "Like post"}
        className={`inline-flex transition-all duration-200 ease-out ${isPopping ? "animate-like-pop" : ""}`}
      >
        <span>{liked ? "❤️" : "🤍"}</span>
        <span>{count}</span>
      </Button>

      {error ? <p className="mt-1 text-xs text-red-700 dark:text-red-300">{error}</p> : null}
    </div>
  );
}
