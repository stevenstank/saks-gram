"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useRef, useState } from "react";

import { Avatar } from "../../../components/ui/avatar";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";
import { useAuth } from "../../../hooks/use-auth";
import { useRequireAuth } from "../../../hooks/use-require-auth";
import { useToast } from "../../../hooks/use-toast";
import { getConversations } from "../../../lib/conversations-api";
import { getConversationMessages, sendTextMessage, type ConversationMessage } from "../../../lib/messages-api";

type ConversationPageProps = {
  params: Promise<{
    conversationId: string;
  }>;
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function ConversationPage({ params }: ConversationPageProps) {
  const resolvedParams = use(params);
  const { isCheckingAuth } = useRequireAuth();
  const { token, user } = useAuth();
  const { showErrorToast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const hasRestoredScrollRef = useRef(false);
  const shouldStickToBottomRef = useRef(true);
  const previousMessageCountRef = useRef(0);

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [headerUser, setHeaderUser] = useState<{ username: string; avatar: string | null }>({
    username: "Conversation",
    avatar: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendFeedback, setSendFeedback] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const rawConversationId = resolvedParams.conversationId;
  const conversationId = Array.isArray(rawConversationId) ? rawConversationId[0] : rawConversationId;
  const scrollStorageKey = `saksgram.chat.scroll.${conversationId}`;

  useEffect(() => {
    if (!token) {
      return;
    }

    if (!conversationId) {
      setError("Missing conversation id");
      setMessages([]);
      setIsLoading(false);
      return;
    }

    if (!UUID_REGEX.test(conversationId)) {
      setError("Invalid conversation");
      setMessages([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    Promise.all([getConversations(token), getConversationMessages(token, conversationId, 1, 100)])
      .then(([conversations, messagesResponse]) => {
        const conversation = conversations.find((item) => item.id === conversationId);
        const participant = conversation?.participants[0];

        setHeaderUser({
          username: participant?.username ?? "Conversation",
          avatar: participant?.avatar ?? null,
        });
        setMessages(messagesResponse.messages);
      })
      .catch((fetchError) => {
        const message = fetchError instanceof Error ? fetchError.message : "Failed to load conversation";
        setError(message.toLowerCase().includes("conversation") ? "Invalid conversation" : "Failed to load messages");
        showErrorToast(message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [conversationId, reloadTick, showErrorToast, token]);

  useEffect(() => {
    if (!conversationId || typeof window === "undefined") {
      return;
    }

    const container = messagesContainerRef.current;

    if (!container) {
      return;
    }

    if (!hasRestoredScrollRef.current) {
      const saved = window.sessionStorage.getItem(scrollStorageKey);

      if (saved !== null) {
        const parsed = Number(saved);

        if (Number.isFinite(parsed)) {
          container.scrollTop = parsed;
        }
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
      }

      hasRestoredScrollRef.current = true;
      previousMessageCountRef.current = messages.length;
      return;
    }

    const hasNewMessage = messages.length > previousMessageCountRef.current;

    if (hasNewMessage && shouldStickToBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }

    previousMessageCountRef.current = messages.length;
  }, [conversationId, messages, scrollStorageKey]);

  useEffect(() => {
    hasRestoredScrollRef.current = false;
    shouldStickToBottomRef.current = true;
    previousMessageCountRef.current = 0;
  }, [conversationId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const container = messagesContainerRef.current;

    if (!container) {
      return;
    }

    const onScroll = (): void => {
      const distanceFromBottom = container.scrollHeight - (container.scrollTop + container.clientHeight);
      shouldStickToBottomRef.current = distanceFromBottom <= 80;
      window.sessionStorage.setItem(scrollStorageKey, String(container.scrollTop));
    };

    container.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", onScroll);
    };
  }, [scrollStorageKey]);

  const canSend = inputValue.trim().length > 0 && !isSending;

  const messageRows = useMemo(
    () =>
      messages.map((message) => {
        const isSender = message.senderId === user?.id;
        const timestamp = new Date(message.createdAt).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        });

        return {
          ...message,
          isSender,
          timestamp,
        };
      }),
    [messages, user?.id],
  );

  async function handleSendMessage(): Promise<void> {
    if (!token || !user || isSending) {
      return;
    }

    if (!conversationId || !UUID_REGEX.test(conversationId)) {
      setSendFeedback("Invalid conversation");
      return;
    }

    if (!inputValue.trim()) {
      setSendFeedback("Message cannot be empty");
      return;
    }

    const content = inputValue.trim();
    const currentConversationId = conversationId;
    const optimisticMessageId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const optimisticMessage: ConversationMessage = {
      id: optimisticMessageId,
      conversationId: currentConversationId,
      senderId: user.id,
      type: "TEXT",
      text: content,
      postId: null,
      createdAt: new Date().toISOString(),
      sender: {
        id: user.id,
        username: user.username,
        avatar: user.avatar ?? null,
      },
      post: null,
    };

    setMessages((current) => [...current, optimisticMessage]);
    setInputValue("");
    setSendFeedback(null);
    shouldStickToBottomRef.current = true;

    setIsSending(true);

    try {
      const sent = await sendTextMessage(token, currentConversationId, content);

      setMessages((current) =>
        current.map((message) =>
          message.id === optimisticMessageId
            ? {
                ...message,
                id: sent.id,
                conversationId: sent.conversationId,
                senderId: sent.senderId,
                type: sent.type,
                text: sent.text,
                postId: sent.postId,
                createdAt: sent.createdAt,
              }
            : message,
        ),
      );
    } catch (sendError) {
      setMessages((current) => current.filter((message) => message.id !== optimisticMessageId));
      setInputValue(content);
      const message = sendError instanceof Error ? sendError.message : "Failed to send message";
      setSendFeedback("Failed to send message");
      showErrorToast(message);
    } finally {
      setIsSending(false);
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
      <main className="w-full py-6">
        <div className="mx-auto w-full max-w-3xl space-y-3">
          <Card className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </Card>

          <Card className="h-[65vh] space-y-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <Skeleton key={item} className="h-16 w-3/4" />
            ))}
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full py-4">
      <div className="mx-auto w-full max-w-3xl space-y-3">
        <Card className="space-y-0 p-0">
          <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/messages" className="text-sm text-gray-400 transition hover:text-white">
                Back
              </Link>
              <Avatar src={headerUser.avatar} alt={`${headerUser.username} avatar`} name={headerUser.username} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{headerUser.username}</p>
              </div>
            </div>
          </div>

          {error ? (
            <div className="flex items-center justify-between gap-2 border-b border-red-900/50 bg-red-950/30 px-4 py-2">
              <p className="text-xs text-red-300">{error}</p>
              <button
                type="button"
                onClick={() => setReloadTick((current) => current + 1)}
                className="rounded-md px-2 py-1 text-xs text-red-200 transition hover:bg-red-900/40"
              >
                Retry
              </button>
            </div>
          ) : null}

          <div ref={messagesContainerRef} className="h-[62vh] overflow-y-auto bg-[#0b0b0b] px-4 py-4">
            {messageRows.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-gray-500">{error ? "Unable to load messages" : "No messages yet. Say hi."}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messageRows.map((message) => (
                    <div key={message.id} className={message.isSender ? "flex justify-end" : "flex justify-start"}>
                      <div className="max-w-[78%]">
                        {!message.isSender ? (
                        <p className="mb-1 px-1 text-xs text-gray-500">{message.sender.username}</p>
                      ) : null}

                      {message.type === "POST" && message.post ? (
                          <Link href={`/posts/${encodeURIComponent(message.post.id)}`} className="block">
                            <div
                              className={[
                                "overflow-hidden rounded-2xl border transition hover:brightness-110",
                                message.isSender
                                  ? "border-yellow-500/40 bg-yellow-500/10"
                                  : "border-gray-700 bg-[#141414]",
                              ].join(" ")}
                            >
                              {message.post.image ? (
                                <img src={message.post.image} alt="Shared post" className="h-48 w-full object-cover" />
                              ) : null}
                              <div className="space-y-1 px-3 py-2">
                                <p className="text-xs text-gray-400">@{message.post.author.username}</p>
                                <p className="text-sm text-white">{message.post.caption}</p>
                              </div>
                          </div>
                          </Link>
                      ) : (
                        <div
                          className={[
                              "rounded-[20px] px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                              message.isSender
                                ? "rounded-br-md bg-yellow-400 text-black"
                                : "rounded-bl-md border border-gray-700 bg-[#151515] text-gray-100",
                          ].join(" ")}
                        >
                          {message.text}
                        </div>
                      )}

                        <p className={message.isSender ? "mt-1 px-1 text-right text-xs text-gray-500" : "mt-1 px-1 text-xs text-gray-500"}>
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} aria-hidden="true" />
              </div>
            )}
          </div>

          <div className="border-t border-gray-800 bg-[#0d0d0d] px-3 py-3">
            <div className="flex items-center gap-2">
              <input
                value={inputValue}
                onChange={(event) => {
                  setInputValue(event.target.value);
                  if (sendFeedback) {
                    setSendFeedback(null);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSendMessage();
                  }
                }}
                placeholder="Message..."
                className="min-h-11 flex-1 rounded-full border border-gray-700 bg-[#171717] px-4 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30"
                disabled={isSending}
              />
              <Button type="button" onClick={() => void handleSendMessage()} disabled={!canSend} loading={isSending} className="min-h-11 rounded-full px-5">
                Send
              </Button>
            </div>
            {sendFeedback ? <p className="mt-2 px-1 text-xs text-red-300">{sendFeedback}</p> : null}
          </div>
        </Card>
      </div>
    </main>
  );
}
