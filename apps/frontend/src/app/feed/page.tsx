"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { PostCard } from "../../../components/feed/PostCard";

type FeedPost = {
  id: string;
  content: string;
  image: string | null;
  createdAt: string;
  author: {
    username: string;
    avatar: string | null;
  };
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
};

type FeedResponse = {
  posts: FeedPost[];
  hasMore: boolean;
};

function isFeedResponse(value: unknown): value is FeedResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("posts" in value) || !("hasMore" in value)) {
    return false;
  }

  return true;
}

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

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const fetchedPagesRef = useRef<Set<number>>(new Set());

  const fetchPage = useCallback(async (targetPage: number): Promise<void> => {
    if (fetchedPagesRef.current.has(targetPage)) {
      return;
    }

    if (targetPage === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    setError(null);

    try {
      const token = getTokenFromStorage();

      const response = await fetch(`${getApiBaseUrl()}/feed?page=${targetPage}&limit=10`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        cache: "no-store",
      });

      const body = (await response.json()) as FeedResponse | { message?: string };

      if (!response.ok) {
        const message =
          typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
            ? body.message
            : "Failed to load feed";
        throw new Error(message);
      }

      if (!isFeedResponse(body)) {
        throw new Error("Invalid feed response");
      }

      fetchedPagesRef.current.add(targetPage);

      setPosts((current) => {
        if (targetPage === 1) {
          return body.posts;
        }

        const existing = new Set(current.map((post) => post.id));
        const nextPosts = body.posts.filter((post) => !existing.has(post.id));
        return [...current, ...nextPosts];
      });
      setHasMore(body.hasMore);
      setPage(targetPage);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load feed");
    } finally {
      if (targetPage === 1) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchPage(1);
  }, [fetchPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (!entry?.isIntersecting) {
          return;
        }

        if (isLoading || isLoadingMore || !hasMore) {
          return;
        }

        void fetchPage(page + 1);
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0.1,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [fetchPage, hasMore, isLoading, isLoadingMore, page]);

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-[600px] px-4 py-6">
        <p>Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-[600px] px-4 py-6">
        <p>{error}</p>
      </main>
    );
  }

  if (!posts.length) {
    return (
      <main className="mx-auto w-full max-w-[600px] px-4 py-6">
        <h1 className="mb-4 text-xl font-semibold">Feed</h1>
        <p>Follow users to see posts</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[600px] px-4 py-6">
      <h1 className="mb-5 text-xl font-semibold">Feed</h1>
      <section className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </section>
      {isLoadingMore ? <p>Loading...</p> : null}
      <div ref={sentinelRef} aria-hidden="true" style={{ height: "1px" }} />
    </main>
  );
}
