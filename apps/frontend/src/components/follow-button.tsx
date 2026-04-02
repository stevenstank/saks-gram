"use client";

import { useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";

import { useAuth } from "../hooks/use-auth";
import { followUser, getFollowStatus, unfollowUser } from "../lib/profile-api";

type FollowButtonProps = {
  targetUserId: string;
  targetUsername: string;
};

function getStatusKey(targetUserId: string, token: string | null): string | null {
  if (!targetUserId || !token) {
    return null;
  }

  return `follow-status:${targetUserId}:${token}`;
}

export function FollowButton({ targetUserId, targetUsername }: FollowButtonProps) {
  const { user, token, isAuthenticated, isBootstrapping } = useAuth();
  const { mutate } = useSWRConfig();
  const [actionError, setActionError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
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

  async function onToggleFollow() {
    if (!token || isMutating || !statusKey || !currentUserId) {
      return;
    }

    setActionError(null);
    setIsMutating(true);

    const optimisticNext = !isCurrentlyFollowing;

    await mutate(statusKey, optimisticNext, false);

    try {
      if (isCurrentlyFollowing) {
        await unfollowUser(targetUserId, token);
      } else {
        await followUser(targetUserId, token);
      }

      await Promise.all([
        mutate(statusKey),
        mutate(`followers:${targetUserId}`),
        mutate(`following:${currentUserId}`),
      ]);
    } catch (error) {
      await mutate(statusKey);
      setActionError(error instanceof Error ? error.message : "Unable to update follow state");
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <div className="mt-4 flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={onToggleFollow}
        disabled={isLoading || isMutating}
        className={
          isCurrentlyFollowing
            ? "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            : "rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        }
        aria-label={isCurrentlyFollowing ? `Unfollow ${targetUsername}` : `Follow ${targetUsername}`}
      >
        {isMutating ? "Updating..." : isCurrentlyFollowing ? "Unfollow" : "Follow"}
      </button>

      {actionError ? <p className="text-sm text-rose-700">{actionError}</p> : null}
    </div>
  );
}
