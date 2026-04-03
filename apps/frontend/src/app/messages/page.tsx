"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Avatar } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { useAuth } from "../../hooks/use-auth";
import { useRequireAuth } from "../../hooks/use-require-auth";
import { useToast } from "../../hooks/use-toast";
import { getConversations, startConversation, type ConversationListItem } from "../../lib/conversations-api";
import { getMyFollowing, type BasicFollowUser } from "../../lib/profile-api";

function formatConversationTimestamp(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  const isSameDay =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate();

  if (isSameDay) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getLastMessagePreview(item: ConversationListItem): string {
  if (!item.lastMessage) {
    return "No messages yet";
  }

  if (item.lastMessage.type === "POST") {
    return "Sent a post";
  }

  return item.lastMessage.text?.trim() || "Message";
}

export default function MessagesPage() {
  const router = useRouter();
  const { isCheckingAuth } = useRequireAuth();
  const { token } = useAuth();
  const { showErrorToast } = useToast();

  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [followedUsers, setFollowedUsers] = useState<BasicFollowUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingUserId, setStartingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    Promise.all([getConversations(token), getMyFollowing(token)])
      .then(([conversationItems, followingItems]) => {
        setConversations(conversationItems);
        setFollowedUsers(followingItems);
      })
      .catch((fetchError) => {
        const message = fetchError instanceof Error ? fetchError.message : "Failed to load messages";
        setError(message);
        showErrorToast(message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [showErrorToast, token]);

  const items = useMemo(
    () =>
      conversations.map((conversation) => {
        const participant = conversation.participants[0];
        return {
          id: conversation.id,
          username: participant?.username ?? "Unknown",
          avatar: participant?.avatar ?? null,
          preview: getLastMessagePreview(conversation),
          timestamp: formatConversationTimestamp(conversation.updatedAt),
        };
      }),
    [conversations],
  );

  const existingConversationUserIds = useMemo(
    () => new Set(conversations.flatMap((conversation) => conversation.participants.map((participant) => participant.id))),
    [conversations],
  );

  const followedWithoutConversation = useMemo(
    () => followedUsers.filter((followed) => !existingConversationUserIds.has(followed.id)),
    [existingConversationUserIds, followedUsers],
  );

  async function handleStartConversation(targetUserId: string): Promise<void> {
    if (!token) {
      return;
    }

    setStartingUserId(targetUserId);

    try {
      const conversationId = await startConversation(token, targetUserId);
      router.push(`/messages/${encodeURIComponent(conversationId)}`);
    } catch (startError) {
      const message = startError instanceof Error ? startError.message : "Failed to start conversation";
      showErrorToast(message);
    } finally {
      setStartingUserId(null);
    }
  }

  if (isCheckingAuth) {
    return (
      <main className="w-full py-8">
        <div className="mx-auto w-full max-w-2xl">
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
        <div className="mx-auto w-full max-w-5xl">
          <Card className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-gray-800 bg-[#0f0f0f] px-3 py-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-52" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full py-4 sm:py-6">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-4 px-1">
          <h1 className="text-2xl font-semibold text-white">Messages</h1>
          <p className="text-sm text-gray-400">Conversations and followed users</p>
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
          <Card className="space-y-4 p-0">
            {error ? (
              <div className="border-b border-red-900/40 bg-red-950/30 px-4 py-2 text-xs text-red-300">{error}</div>
            ) : null}

            <section className="px-3 pt-3">
              <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Conversations</h2>

              {items.length === 0 ? (
                <div className="px-1 py-4 text-sm text-gray-400">Start a conversation</div>
              ) : null}

              <div className="mt-2 max-h-[320px] overflow-y-auto">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/messages/${item.id}`}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-[#1a1a1a]"
                  >
                    <Avatar src={item.avatar} alt={`${item.username} avatar`} name={item.username} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{item.username}</p>
                      <p className="truncate text-xs text-gray-400">{item.preview}</p>
                    </div>
                    <p className="shrink-0 text-xs text-gray-500">{item.timestamp}</p>
                  </Link>
                ))}
              </div>
            </section>

            <section className="border-t border-gray-800 px-3 pb-3 pt-3">
              <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Start New Chat</h2>
              <div className="mt-2 max-h-[300px] space-y-1 overflow-y-auto">
                {followedWithoutConversation.length === 0 ? (
                  <p className="px-1 py-2 text-sm text-gray-400">You are already chatting with followed users.</p>
                ) : (
                  followedWithoutConversation.map((followed) => (
                    <button
                      key={followed.id}
                      type="button"
                      onClick={() => {
                        void handleStartConversation(followed.id);
                      }}
                      disabled={startingUserId !== null}
                      className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar src={followed.avatar ?? null} alt={`${followed.username} avatar`} name={followed.username} size="sm" />
                        <span className="truncate text-sm text-white">{followed.username}</span>
                      </div>
                      <span className="text-xs text-gray-500">{startingUserId === followed.id ? "Starting..." : "Message"}</span>
                    </button>
                  ))
                )}
              </div>
            </section>
          </Card>

          <div className="hidden lg:block">
            <Card className="flex h-full min-h-[320px] items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-gray-400">Select a conversation to open chat</p>
                {items[0] ? (
                  <Link href={`/messages/${items[0].id}`} className="mt-3 inline-flex">
                    <Button type="button" variant="secondary">Open latest chat</Button>
                  </Link>
                ) : null}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
