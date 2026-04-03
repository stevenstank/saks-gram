"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Avatar } from "../../src/components/ui/avatar";
import { Button } from "../../src/components/ui/button";
import { Card } from "../../src/components/ui/card";
import { InputField } from "../../src/components/ui/input-field";
import { SharePostModal } from "../../src/components/share-post-modal";
import { useToast } from "../../src/hooks/use-toast";
import API_URL from "../../src/lib/api-config";

type FeedPost = {
  id: string;
  content: string;
  image: string | null;
  createdAt: string;
  author?: {
    username?: string;
    avatar?: string | null;
  };
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
};

type PostCardProps = {
  post: FeedPost;
};

type CommentItem = {
  id: string;
  content: string;
  createdAt: string;
  user: {
    username: string;
    avatar: string | null;
  };
  optimistic?: boolean;
};

type GetCommentsResponse = {
  success: boolean;
  data: {
    comments: CommentItem[];
  };
};

type CreateCommentResponse = {
  success: boolean;
  data: {
    comment: CommentItem;
  };
};

export function PostCard({ post }: PostCardProps) {
  const { showErrorToast } = useToast();
  const username = post.author?.username ?? "Unknown";
  const avatar = post.author?.avatar ?? null;
  const createdAt = new Date(post.createdAt).toLocaleString();
  const [liked, setLiked] = useState(post.isLiked ?? false);
  const [isLikePopping, setIsLikePopping] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [isCommentsLoading, setIsCommentsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const commentInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setLiked(post.isLiked ?? false);
    setLikesCount(post.likesCount);
  }, [post.id]);

  useEffect(() => {
    setCommentsCount(post.commentsCount);
  }, [post.commentsCount]);

  useEffect(() => {
    let isMounted = true;

    async function loadComments(): Promise<void> {
      if (!post.id) {
        setComments([]);
        setIsCommentsLoading(false);
        return;
      }

      setIsCommentsLoading(true);

      try {
        const response = await fetch(`${API_URL}/api/posts/${encodeURIComponent(post.id)}/comments`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        const body = (await response.json()) as GetCommentsResponse | { message?: string };

        if (!response.ok) {
          const message =
            typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
              ? body.message
              : "Failed to load comments";
          throw new Error(message);
        }

        if (!isMounted || !("data" in body)) {
          return;
        }

        const unique = new Map<string, CommentItem>();
        for (const comment of body.data.comments) {
          if (!unique.has(comment.id)) {
            unique.set(comment.id, comment);
          }
        }

        const allComments = Array.from(unique.values());
        setComments(allComments);
        setCommentsCount(allComments.length);
      } catch {
        if (!isMounted) {
          return;
        }
        setComments([]);
        showErrorToast("Failed to load comments");
      } finally {
        if (isMounted) {
          setIsCommentsLoading(false);
        }
      }
    }

    void loadComments();

    return () => {
      isMounted = false;
    };
  }, [post.id, showErrorToast]);

  async function handleLike(): Promise<void> {
    if (!post.id || isTogglingLike) {
      return;
    }

    const previousLiked = liked;
    const previousCount = likesCount;
    setIsLikePopping(true);
    window.setTimeout(() => setIsLikePopping(false), 220);
    setIsTogglingLike(true);
    setError(null);

    if (liked) {
      setLiked(false);
      setLikesCount((prev) => Math.max(0, prev - 1));

      try {
        const response = await fetch(`${API_URL}/api/posts/${encodeURIComponent(post.id)}/like`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to update like status");
        }
      } catch {
        setLiked(previousLiked);
        setLikesCount(previousCount);
        setError("Failed to update like");
        showErrorToast("Failed to update like");
      } finally {
        setIsTogglingLike(false);
      }

      return;
    }

    setLiked(true);
    setLikesCount((prev) => prev + 1);

    try {
      const response = await fetch(`${API_URL}/api/posts/${encodeURIComponent(post.id)}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to update like status");
      }
    } catch {
      setLiked(previousLiked);
      setLikesCount(previousCount);
      setError("Failed to update like");
      showErrorToast("Failed to update like");
    } finally {
      setIsTogglingLike(false);
    }
  }

  async function onSubmitComment(): Promise<void> {
    const content = newComment.trim();

    if (!post.id || !content || isSubmittingComment) {
      return;
    }

    const rawUser = typeof window !== "undefined" ? localStorage.getItem("saksgram.auth.user") : null;

    let optimisticUser = { username: "You", avatar: null as string | null };
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser) as { username?: string; avatar?: string | null };
        optimisticUser = {
          username: parsed.username ?? "You",
          avatar: parsed.avatar ?? null,
        };
      } catch {
        optimisticUser = { username: "You", avatar: null };
      }
    }

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimisticComment: CommentItem = {
      id: tempId,
      content,
      createdAt: new Date().toISOString(),
      user: optimisticUser,
      optimistic: true,
    };

    setComments((prev) => [optimisticComment, ...prev]);
    setCommentsCount((prev) => prev + 1);
    setNewComment("");
    setIsSubmittingComment(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/posts/${encodeURIComponent(post.id)}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ content }),
      });

      const body = (await response.json()) as CreateCommentResponse | { message?: string };

      if (!response.ok || !("data" in body)) {
        const message =
          typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
            ? body.message
            : "Failed to create comment";
        throw new Error(message);
      }

      setComments((prev) => {
        const withoutTemp = prev.filter((comment) => comment.id !== tempId);
        const exists = withoutTemp.some((comment) => comment.id === body.data.comment.id);
        if (exists) {
          return withoutTemp;
        }
        return [body.data.comment, ...withoutTemp];
      });
    } catch {
      setComments((prev) => prev.filter((comment) => comment.id !== tempId));
      setCommentsCount((prev) => Math.max(0, prev - 1));
      setNewComment(content);
      setError("Failed to add comment");
      showErrorToast("Failed to add comment");
    } finally {
      setIsSubmittingComment(false);
    }
  }

  function onCommentClick(): void {
    if (!post.id) {
      return;
    }
    commentInputRef.current?.focus();
  }

  return (
    <Card className="space-y-4 border-gray-800 bg-[#111111] p-4 shadow-md">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar src={avatar} alt={`${username} avatar`} name={username} size="md" />

          <div className="min-w-0">
            <Link
              href={username !== "Unknown" ? `/profile/${encodeURIComponent(username)}` : "/profile"}
              className="block truncate text-sm font-semibold text-white hover:cursor-pointer hover:underline"
            >
              {username}
            </Link>
            <p className="text-xs text-gray-400">{createdAt}</p>
          </div>
        </div>
      </header>

      <div className="space-y-3">
        <p className="whitespace-pre-wrap break-words text-[15px] leading-6 text-white">{post.content}</p>
        {post.image ? <img src={post.image} alt="Post" className="max-h-96 w-full rounded-2xl object-cover" /> : null}
      </div>

      <footer className="flex flex-wrap items-center gap-3 border-t border-gray-800 pt-3 text-sm">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={() => {
              void handleLike();
            }}
            disabled={isTogglingLike}
            variant={liked ? "danger" : "secondary"}
            className={`transition-all duration-200 ease-out ${isLikePopping ? "animate-like-pop" : ""}`}
          >
            {liked ? "❤️" : "🤍"} Like
          </Button>
          <span className="text-gray-400">{likesCount}</span>
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" onClick={onCommentClick} className="transition duration-200">
            💬 Comment
          </Button>
          <span className="text-gray-400">{commentsCount}</span>
        </div>

        <Button
          type="button"
          variant="ghost"
          aria-label="Share post"
          title="Share"
          onClick={() => setIsShareModalOpen(true)}
          className="h-10 w-10 rounded-full px-0 text-gray-300"
        >
          ↗
        </Button>

        <Link href={username !== "Unknown" ? `/profile/${encodeURIComponent(username)}` : "/profile"}>
          <Button type="button" variant="ghost" className="text-gray-300">
            View
          </Button>
        </Link>
      </footer>

      <section className="mt-4 space-y-4">
        {isCommentsLoading ? <p className="text-sm text-gray-400">Loading comments...</p> : null}

        {!isCommentsLoading && comments.length === 0 ? <p className="text-sm text-gray-400">No comments yet</p> : null}

        {!isCommentsLoading
          ? comments.map((comment) => (
              <div key={comment.id} className="rounded-md border border-gray-800 bg-[#0f0f0f] px-3 py-2">
                <Link
                  href={`/profile/${encodeURIComponent(comment.user.username)}`}
                  className="block text-sm font-semibold text-white hover:cursor-pointer hover:underline"
                >
                  {comment.user.username}
                </Link>
                <p className="text-sm text-gray-300">{comment.content}</p>
              </div>
            ))
          : null}

        <div className="flex flex-col items-stretch gap-4 pt-1 sm:flex-row sm:items-center">
          <InputField
            ref={commentInputRef}
            id={`feed-comment-${post.id}`}
            label=""
            type="text"
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void onSubmitComment();
              }
            }}
            placeholder="Write a comment..."
            className="flex-1"
            disabled={isSubmittingComment}
          />
          <Button
            type="button"
            onClick={() => {
              void onSubmitComment();
            }}
            variant="secondary"
            loading={isSubmittingComment}
            disabled={isSubmittingComment}
          >
            {isSubmittingComment ? "Posting..." : "Post"}
          </Button>
        </div>
      </section>

      {error ? (
        <p className="mt-2 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <SharePostModal isOpen={isShareModalOpen} postId={post.id} onClose={() => setIsShareModalOpen(false)} />
    </Card>
  );
}
