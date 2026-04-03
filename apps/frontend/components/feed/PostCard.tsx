"use client";

import { useEffect, useRef, useState } from "react";

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
  const username = post.author?.username ?? "Unknown";
  const avatar = post.author?.avatar ?? null;
  const createdAt = new Date(post.createdAt).toLocaleString();
  const [liked, setLiked] = useState(post.isLiked ?? false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [isCommentsLoading, setIsCommentsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        const token = getTokenFromStorage();

        const response = await fetch(`${getApiBaseUrl()}/api/posts/${encodeURIComponent(post.id)}/comments`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
  }, [post.id]);

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

  async function handleLike(): Promise<void> {
    if (!post.id || isTogglingLike) {
      return;
    }

    const previousLiked = liked;
    const previousCount = likesCount;
    setIsTogglingLike(true);
    setError(null);

    if (liked) {
      setLiked(false);
      setLikesCount((prev) => Math.max(0, prev - 1));

      try {
        const token = getTokenFromStorage();

        const response = await fetch(`${getApiBaseUrl()}/api/posts/${encodeURIComponent(post.id)}/like`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
      } finally {
        setIsTogglingLike(false);
      }

      return;
    }

    setLiked(true);
    setLikesCount((prev) => prev + 1);

    try {
      const token = getTokenFromStorage();

      const response = await fetch(`${getApiBaseUrl()}/api/posts/${encodeURIComponent(post.id)}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    } finally {
      setIsTogglingLike(false);
    }
  }

  async function onSubmitComment(): Promise<void> {
    const content = newComment.trim();

    if (!post.id || !content || isSubmittingComment) {
      return;
    }

    const token = getTokenFromStorage();
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
      const response = await fetch(`${getApiBaseUrl()}/api/posts/${encodeURIComponent(post.id)}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    <article className="rounded-2xl border border-black/10 p-4 shadow-sm">
      <header className="mb-3 flex items-center gap-3">
        {avatar ? (
          <img src={avatar} alt={`${username} avatar`} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-sm font-semibold">
            {username.slice(0, 1).toUpperCase()}
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{username}</p>
          <p className="text-xs opacity-70">{createdAt}</p>
        </div>
      </header>

      <p className="whitespace-pre-wrap break-words text-[15px] leading-6">{post.content}</p>

      {post.image ? <img src={post.image} alt="Post" className="mt-3 max-h-96 w-full rounded-xl object-cover" /> : null}

      <footer className="mt-4 flex items-center gap-5 text-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void handleLike();
            }}
            disabled={isTogglingLike}
            className={`cursor-pointer rounded-md border px-3 py-1.5 transition duration-200 hover:opacity-80 ${
              liked ? "border-red-500 bg-red-500 text-white" : "border-black/20"
            }`}
          >
            {liked ? "❤️" : "🤍"} Like
          </button>
          <span className="opacity-70">{likesCount}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCommentClick}
            className="cursor-pointer rounded-md border border-black/20 px-3 py-1.5 transition duration-200 hover:opacity-80"
          >
            💬 Comment
          </button>
          <span className="opacity-70">{commentsCount}</span>
        </div>
      </footer>

      <section className="mt-4 space-y-2">
        {isCommentsLoading ? <p className="text-sm opacity-70">Loading comments...</p> : null}

        {!isCommentsLoading && comments.length === 0 ? <p className="text-sm opacity-70">No comments yet</p> : null}

        {!isCommentsLoading
          ? comments.map((comment) => (
              <div key={comment.id} className="rounded-md border border-black/10 px-3 py-2">
                <strong className="block text-sm">{comment.user.username}</strong>
                <p className="text-sm opacity-90">{comment.content}</p>
              </div>
            ))
          : null}

        <div className="flex items-center gap-2 pt-1">
          <input
            ref={commentInputRef}
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
            className="flex-1 rounded-md border border-black/20 px-3 py-2 text-sm outline-none"
            disabled={isSubmittingComment}
          />
          <button
            type="button"
            onClick={() => {
              void onSubmitComment();
            }}
            className="cursor-pointer rounded-md border border-black/20 px-3 py-2 text-sm transition duration-200 hover:opacity-80"
            disabled={isSubmittingComment}
          >
            {isSubmittingComment ? "Posting..." : "Post"}
          </button>
        </div>
      </section>

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </article>
  );
}
