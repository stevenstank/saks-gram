"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";

import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";
import { startConversation } from "../lib/conversations-api";
import { followUser, getFollowStatus, unfollowUser } from "../lib/profile-api";
import { Button } from "./ui/button";

type FollowButtonProps = {
  targetUserId: string;
  targetUsername: string;
  compact?: boolean;
};

function getStatusKey(targetUserId: string, token: string | null): string | null {
  if (!targetUserId || !token) {
    return null;
  }

  return `follow-status:${targetUserId}:${token}`;
}

export function FollowButton({ targetUserId, targetUsername, compact = false }: FollowButtonProps) {
  const router = useRouter();
  const { user, token, isAuthenticated, isBootstrapping } = useAuth();
  const { showErrorToast, showSuccessToast } = useToast();
  const { mutate } = useSWRConfig();
  const [actionError, setActionError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const currentUserId = user?.id ?? null;

  const isOwnProfile = useMemo(() => currentUserId === targetUserId, [targetUserId, currentUserId]);
  const statusKey = getStatusKey(targetUserId, token);

  const { data: isFollowing, isLoading } = useSWR(
    statusKey,
    async () => {
      if (!token) {
        return false;
      }

      return getFollowStatus(targetUserId, token);
    },
    {
      revalidateOnFocus: true,
      shouldRetryOnError: false,
    },
  );

  if (isBootstrapping || !isAuthenticated || !user || isOwnProfile) {
    return null;
  }

  const isCurrentlyFollowing = Boolean(isFollowing);

  async function onToggleFollow(nextFollowingState: boolean) {
    if (!token || isMutating || !statusKey || !currentUserId) {
      return;
    }

    setActionError(null);
    setIsMutating(true);

    const optimisticNext = nextFollowingState;

    await mutate(statusKey, optimisticNext, false);

    try {
      if (nextFollowingState) {
        await followUser(targetUserId, token);
      } else {
        await unfollowUser(targetUserId, token);
      }

      await Promise.all([
        mutate(statusKey),
        mutate(`followers:${targetUsername}`),
        mutate(`following:${targetUsername}`),
        mutate(`following:${currentUserId}`),
      ]);

      if (nextFollowingState) {
        showSuccessToast(`You are now following ${targetUsername}`);
      }
    } catch (error) {
      await mutate(statusKey);
      const message = error instanceof Error ? error.message : "Unable to update follow state";
      setActionError(message);
      showErrorToast(message);
    } finally {
      setIsMutating(false);
    }
  }

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handleOutsideClick(event: MouseEvent): void {
      if (!menuRef.current) {
        return;
      }

      if (menuRef.current.contains(event.target as Node)) {
        return;
      }

      setIsMenuOpen(false);
    }

    window.addEventListener("mousedown", handleOutsideClick);
    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isMenuOpen]);

  async function onMessageClick(): Promise<void> {
    if (!token || isMutating) {
      return;
    }

    try {
      const conversationId = await startConversation(token, targetUserId);
      router.push(`/messages/${encodeURIComponent(conversationId)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to open message";
      showErrorToast(message);
    }

    setIsMenuOpen(false);
  }

  async function onUnfollowClick(): Promise<void> {
    setIsMenuOpen(false);
    await onToggleFollow(false);
  }

  async function onFollowClick(): Promise<void> {
    await onToggleFollow(true);
  }

  if (compact) {
    return (
      <div className="flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => {
            void onToggleFollow(!isCurrentlyFollowing);
          }}
          disabled={isLoading || isMutating}
          aria-label={isCurrentlyFollowing ? `Unfollow ${targetUsername}` : `Follow ${targetUsername}`}
          className="rounded-md bg-yellow-400 px-3 py-1 text-sm font-medium text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isMutating ? "..." : isCurrentlyFollowing ? "Following" : "Follow"}
        </button>

        {actionError ? (
          <p className="rounded-md border border-red-900/50 bg-red-950/30 px-2 py-1 text-xs text-red-300">
            {actionError}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col items-start gap-3">
      {!isCurrentlyFollowing ? (
        <Button
          type="button"
          onClick={() => {
            void onFollowClick();
          }}
          variant="primary"
          loading={isMutating}
          disabled={isLoading || isMutating}
          aria-label={`Follow ${targetUsername}`}
        >
          {isMutating ? "Updating..." : "Follow"}
        </Button>
      ) : (
        <div ref={menuRef} className="relative flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsMenuOpen((current) => !current)}
            disabled={isLoading || isMutating}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            aria-label={`Following options for ${targetUsername}`}
          >
            Following
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={() => {
              void onMessageClick();
            }}
            disabled={isLoading || isMutating}
          >
            Message
          </Button>

          {isMenuOpen ? (
            <div className="absolute left-0 top-12 z-20 w-40 rounded-xl border border-gray-800 bg-[#0f0f0f] p-2 shadow-medium">
              <button
                type="button"
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-white transition hover:bg-gray-800"
                onClick={() => {
                  void onUnfollowClick();
                }}
                disabled={isMutating}
              >
                Unfollow
              </button>
              <button
                type="button"
                className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-white transition hover:bg-gray-800"
                onClick={() => {
                  void onMessageClick();
                }}
              >
                Message
              </button>
            </div>
          ) : null}
        </div>
      )}

      {actionError ? (
        <p className="rounded-md border border-red-900/50 bg-red-950/30 px-2.5 py-1.5 text-sm text-red-300">
          {actionError}
        </p>
      ) : null}
    </div>
  );
}
