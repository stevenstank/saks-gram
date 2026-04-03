"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { PostCard } from "../../../components/feed/PostCard";
import { CreatePost } from "../../components/create-post";
import { Avatar } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { FollowButton } from "../../components/follow-button";
import { Skeleton } from "../../components/ui/skeleton";
import { useAuth } from "../../hooks/use-auth";
import { useRequireAuth } from "../../hooks/use-require-auth";
import { useToast } from "../../hooks/use-toast";
import API_URL from "../../lib/api-config";
import { getAllUsers, type DiscoverUser } from "../../lib/profile-api";

type FeedPost = {
  id: string;
  content: string;
  image: string | null;
  createdAt: string;
  author: {
    id?: string;
    username: string;
    avatar: string | null;
  };
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
};

type FeedSuccessResponse = {
  type: "FEED";
  posts: FeedPost[];
  hasMore: boolean;
};

type SuggestionsResponse = {
  type: "SUGGESTIONS";
  users: DiscoverUser[];
};

type EmptyFeedResponse = {
  type: "EMPTY_FEED";
  message: string;
};

type FeedApiResponse = FeedSuccessResponse | SuggestionsResponse | EmptyFeedResponse;

function isFeedSuccessResponse(value: unknown): value is FeedSuccessResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("type" in value) || value.type !== "FEED") {
    return false;
  }

  if (!("posts" in value) || !("hasMore" in value)) {
    return false;
  }

  return true;
}

function isSuggestionsResponse(value: unknown): value is SuggestionsResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("type" in value) || value.type !== "SUGGESTIONS") {
    return false;
  }

  return "users" in value && Array.isArray(value.users);
}

function isEmptyFeedResponse(value: unknown): value is EmptyFeedResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("type" in value) || value.type !== "EMPTY_FEED") {
    return false;
  }

  return "message" in value && typeof value.message === "string";
}

export default function FeedPage() {
  const { isCheckingAuth } = useRequireAuth();
  const { user, logout } = useAuth();
  const { showErrorToast } = useToast();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedType, setFeedType] = useState<FeedApiResponse["type"] | null>(null);
  const [emptyFeedMessage, setEmptyFeedMessage] = useState<string>("No posts yet from people you follow");
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const fetchedPagesRef = useRef<Set<number>>(new Set());

  const suggestedUsers = users
    .filter((candidate) => candidate.id !== user?.id)
    .slice(0, 12);

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
      const response = await fetch(`${API_URL}/feed?page=${targetPage}&limit=10`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store",
      });

      const body = (await response.json()) as FeedApiResponse | { message?: string };

      if (!response.ok) {
        const message =
          typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
            ? body.message
            : "Failed to load feed";
        throw new Error(message);
      }

      if (isSuggestionsResponse(body)) {
        fetchedPagesRef.current.add(targetPage);
        setFeedType("SUGGESTIONS");
        setEmptyFeedMessage("No posts yet from people you follow");
        setPosts([]);
        setHasMore(false);
        setPage(targetPage);
        return;
      }

      if (isEmptyFeedResponse(body)) {
        fetchedPagesRef.current.add(targetPage);
        setFeedType("EMPTY_FEED");
        setEmptyFeedMessage(body.message);
        setPosts([]);
        setHasMore(false);
        setPage(targetPage);
        return;
      }

      if (!isFeedSuccessResponse(body)) {
        throw new Error("Invalid feed response");
      }

      fetchedPagesRef.current.add(targetPage);
      setFeedType("FEED");
      setEmptyFeedMessage("No posts yet from people you follow");

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
      const message = fetchError instanceof Error ? fetchError.message : "Failed to load feed";
      setError(message);
      showErrorToast(message);
    } finally {
      if (targetPage === 1) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [showErrorToast]);

  useEffect(() => {
    void fetchPage(1);
  }, [fetchPage]);

  useEffect(() => {
    setIsUsersLoading(true);

    getAllUsers()
      .then((allUsers) => {
        setUsers(allUsers);
      })
      .catch((usersError) => {
        const message = usersError instanceof Error ? usersError.message : "Failed to load users";
        showErrorToast(message);
        setUsers([]);
      })
      .finally(() => {
        setIsUsersLoading(false);
      });
  }, [showErrorToast]);

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

  if (isCheckingAuth) {
    return (
      <main className="w-full py-8">
        <div className="mx-auto w-full max-w-[1100px]">
          <Card>
            <p className="text-sm text-gray-400">Checking your session...</p>
          </Card>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="w-full py-8">
        <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-6 lg:grid-cols-[220px_1fr_260px]">
          <aside>
            <Card className="space-y-6">
              <Skeleton className="h-6 w-28" />
              <div className="space-y-4">
                {[1, 2, 3, 4].map((item) => (
                  <Skeleton key={item} className="h-10 w-full" />
                ))}
              </div>
            </Card>
          </aside>

          <section className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
              Loading posts...
            </div>
            {[1, 2, 3].map((item) => (
              <Card key={item} className="space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-44 w-full sm:h-48" />
              </Card>
            ))}
          </section>

          <aside>
            <Card className="space-y-4">
              <Skeleton className="h-5 w-36" />
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </Card>
          </aside>
          </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="w-full py-8">
        <div className="mx-auto w-full max-w-[1100px]">
          <Card>
            <h1 className="text-lg font-semibold text-red-300">Feed Error</h1>
            <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full py-6">
      <aside className="fixed top-16 left-0 z-30 hidden h-[calc(100vh-4rem)] w-[220px] bg-black border-r border-gray-800 p-4 lg:block">
        <nav className="flex flex-col gap-4">
          <Link href="/feed" className="text-white px-3 py-2 rounded-md hover:bg-gray-900 cursor-pointer">
            Feed
          </Link>
          <Link href="/messages" className="text-white px-3 py-2 rounded-md hover:bg-gray-900 cursor-pointer text-left">
            Messages
          </Link>
          <button
            type="button"
            onClick={() => setIsCreatePostOpen(true)}
            className="text-white px-3 py-2 rounded-md hover:bg-gray-900 cursor-pointer text-left"
          >
            Create Post
          </button>
          <Link
            href={user?.username ? `/profile/${encodeURIComponent(user.username)}` : "/profile"}
            className="text-white px-3 py-2 rounded-md hover:bg-gray-900 cursor-pointer"
          >
            Profile
          </Link>
          <button
            type="button"
            onClick={logout}
            className="text-white px-3 py-2 rounded-md hover:bg-gray-900 cursor-pointer text-left"
          >
            Logout
          </button>
        </nav>
      </aside>

      <div className="px-4 pt-20 lg:ml-[220px] lg:mr-[260px] lg:px-6">
        <section className="mx-auto w-full max-w-[600px] space-y-6">
          <h1 className="text-xl font-semibold text-white">Feed</h1>
          {feedType === "SUGGESTIONS" ? (
            <p className="mt-20 text-center text-lg text-white">Follow people to expand your feed</p>
          ) : feedType === "EMPTY_FEED" ? (
            <p className="mt-20 text-center text-lg text-gray-400">{emptyFeedMessage}</p>
          ) : posts.length === 0 ? (
            <p className="mt-20 text-center text-lg text-gray-400">No posts yet from people you follow</p>
          ) : (
            <>
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
              {isLoadingMore ? <p className="mt-4 text-sm text-gray-400">Loading more posts...</p> : null}
              <div ref={sentinelRef} aria-hidden="true" style={{ height: "1px" }} />
            </>
          )}
        </section>
      </div>

      <aside className="fixed right-0 top-16 z-30 hidden h-[calc(100vh-4rem)] w-[260px] overflow-y-auto border-l border-gray-800 bg-black p-4 text-white lg:block">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">Suggested Users</h2>

        <div className="space-y-4 pb-8">
          {isUsersLoading ? (
            [1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-center justify-between gap-3 rounded-xl border border-gray-800 bg-[#0f0f0f] px-3 py-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            ))
          ) : suggestedUsers.length === 0 ? (
            <p className="text-sm text-gray-400">No users yet</p>
          ) : (
            suggestedUsers.map((suggested) => (
              <div
                key={suggested.id}
                className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-gray-800 bg-[#0f0f0f] p-2 transition hover:bg-gray-800"
              >
                <Link href={`/profile/${encodeURIComponent(suggested.username)}`} className="flex min-w-0 items-center gap-3">
                  <Avatar src={suggested.avatar ?? null} alt={`${suggested.username} avatar`} name={suggested.username} size="sm" />
                  <span className="truncate text-sm font-bold text-white hover:underline">{suggested.username}</span>
                </Link>
                <FollowButton targetUserId={suggested.id} targetUsername={suggested.username} compact />
              </div>
            ))
          )}
        </div>
      </aside>

      {isCreatePostOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-xl rounded-xl border border-gray-800 bg-[#0f0f0f] p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Create Post</h2>
              <button
                type="button"
                onClick={() => setIsCreatePostOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-white"
              >
                Close
              </button>
            </div>

            <CreatePost
              onCreated={(createdPost) => {
                setPosts((current) => [
                  {
                    id: createdPost.id,
                    content: createdPost.content,
                    image: createdPost.imageUrl ?? null,
                    createdAt: createdPost.createdAt,
                    author: {
                      username: createdPost.author?.username ?? user?.username ?? "You",
                      avatar: createdPost.author?.avatar ?? user?.avatar ?? null,
                    },
                    likesCount: createdPost.likesCount ?? 0,
                    commentsCount: 0,
                    isLiked: createdPost.isLiked ?? false,
                  },
                  ...current,
                ]);
                setIsCreatePostOpen(false);
              }}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}
